const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const emailService = require('./email.service');

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
        const userId = name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);

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
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                isVerified: false
            }
        });

        console.log('✅ User created in database:', userId);

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store with expiration (10 minutes)
        emailVerificationCodes[email] = {
            code: verificationCode,
            userId: user.userId,
            expiresAt: Date.now() + (10 * 60 * 1000)
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

        if (!verification) {
            console.log('❌ VERIFY EMAIL: No verification code found');
            throw new Error('Invalid or expired verification code');
        }

        if (verification.expiresAt < Date.now()) {
            delete emailVerificationCodes[email];
            console.log('❌ VERIFY EMAIL: Code expired');
            throw new Error('Verification code expired');
        }

        if (verification.code !== code) {
            console.log('❌ VERIFY EMAIL: Code mismatch');
            throw new Error('Invalid verification code');
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
        const token = jwt.sign(
            { userId: user.userId, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

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
        const token = jwt.sign(
            { userId: user.userId, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

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
