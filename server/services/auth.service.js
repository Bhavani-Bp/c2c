const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const emailService = require('./email.service');
const { generateUserId } = require('../utils/stringUtils');
const { generateOTP, createOTPVerification, verifyOTP } = require('../utils/otpUtils');
const { generateToken } = require('../utils/tokenUtils');
const { generateSearchName } = require('../utils/searchUtils');

// In-memory store for verification codes (in production, use Redis)
const emailVerificationCodes = {};

class AuthService {
    /**
     * User Signup
     */
    async signup({ name, email, password, dateOfBirth }) {
        console.log('📝 AUTH SERVICE: Signup initiated', { name, email });

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Generate unique userId
        const userId = generateUserId(name);

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user in database
        const user = await prisma.user.create({
            data: {
                userId,
                name,
                email,
                passwordHash,
                searchName: generateSearchName(name), // For optimized search
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                isVerified: false
            }
        });

        console.log('✅ User created in database:', userId);

        // Generate 6-digit verification code
        const verificationCode = generateOTP();

        // Store with expiration (10 minutes)
        const otpVerification = createOTPVerification(verificationCode, 10);
        emailVerificationCodes[email] = {
            ...otpVerification,
            userId: user.userId
        };

        // Send verification email
        await emailService.sendVerificationEmail(email, verificationCode);

        console.log(`✅ SIGNUP SUCCESS - Verification email sent to ${email}`);
        console.log('⚠️  User must verify email before receiving access token');

        return {
            requiresVerification: true,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                isVerified: false
            }
        };
    }

    /**
     * Verify Email
     */
    async verifyEmail({ email, code }) {
        console.log('📧 AUTH SERVICE: Email verification', { email, code });

        const verification = emailVerificationCodes[email];

        // Use utility function to verify OTP
        const otpCheck = verifyOTP(verification, code);

        if (!otpCheck.valid) {
            if (otpCheck.reason === 'Verification code expired') {
                delete emailVerificationCodes[email];
            }
            console.log('❌ VERIFY EMAIL:', otpCheck.reason);
            throw new Error(otpCheck.reason);
        }

        // Update user's verified status
        const user = await prisma.user.update({
            where: { userId: verification.userId },
            data: { isVerified: true },
            select: {
                userId: true,
                name: true,
                email: true,
                avatarUrl: true,
                bio: true,
                interests: true,
                isVerified: true,
                createdAt: true
            }
        });

        // Clean up verification code
        delete emailVerificationCodes[email];
        console.log('✅ EMAIL VERIFIED:', { userId: user.userId, email });

        // Generate JWT token AFTER verification
        const token = generateToken({ userId: user.userId, email: user.email });

        console.log('✅ JWT token issued after email verification');

        return { token, user };
    }

    /**
     * User Login
     */
    async login({ email, password }) {
        console.log('🔐 AUTH SERVICE: Login attempt', { email });

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log('❌ LOGIN: User not found');
            throw new Error('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            console.log('❌ LOGIN: Invalid password');
            throw new Error('Invalid credentials');
        }

        // Check if email is verified
        if (!user.isVerified) {
            console.log('⚠️ LOGIN: Email not verified');
            const error = new Error('Email not verified');
            error.requiresVerification = true;
            throw error;
        }

        // Generate JWT token
        const token = generateToken({ userId: user.userId, email: user.email });

        console.log('✅ LOGIN SUCCESS:', { email, name: user.name });

        return {
            token,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                interests: user.interests,
                isVerified: user.isVerified
            }
        };
    }

    /**
     * Get Current User
     */
    async getCurrentUser(userId) {
        const user = await prisma.user.findUnique({
            where: { userId },
            select: {
                userId: true,
                name: true,
                email: true,
                avatarUrl: true,
                bio: true,
                interests: true,
                isVerified: true,
                createdAt: true
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }
}

module.exports = new AuthService();
