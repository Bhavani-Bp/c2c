/**
 * Delete User Script
 * 
 * Deletes a user from the database by email.
 * Useful for testing and cleanup.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function deleteUser() {
    console.log('\n' + '='.repeat(60));
    console.log('🗑️  DELETE USER FROM DATABASE');
    console.log('='.repeat(60));

    rl.question('\nEnter email address to delete (or "list" to see all users): ', async (input) => {
        const email = input.trim();

        if (!email) {
            console.log('❌ Email cannot be empty');
            rl.close();
            await prisma.$disconnect();
            return;
        }

        if (email.toLowerCase() === 'list') {
            await listAllUsers();
            rl.close();
            await prisma.$disconnect();
            return;
        }

        try {
            // Find user first
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                console.log(`\n❌ User not found with email: ${email}`);
                rl.close();
                await prisma.$disconnect();
                return;
            }

            console.log('\n📋 User Details:');
            console.log(`   User ID: ${user.userId}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Verified: ${user.isVerified ? 'Yes ✅' : 'No ❌'}`);
            console.log(`   Created: ${user.createdAt.toLocaleString()}`);

            rl.question('\n⚠️  Are you sure you want to delete this user? (yes/no): ', async (confirm) => {
                if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
                    try {
                        // Delete user (cascade will delete related data)
                        await prisma.user.delete({
                            where: { email }
                        });

                        console.log('\n✅ User deleted successfully!');
                        console.log(`   Email: ${email}`);
                    } catch (error) {
                        console.error('\n❌ Error deleting user:', error.message);
                    }
                } else {
                    console.log('\n⏭️  Deletion cancelled');
                }

                rl.close();
                await prisma.$disconnect();
            });
        } catch (error) {
            console.error('\n❌ Error:', error.message);
            rl.close();
            await prisma.$disconnect();
        }
    });
}

async function listAllUsers() {
    console.log('\n📋 All Users in Database:');
    console.log('='.repeat(60));

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });

        if (users.length === 0) {
            console.log('\nNo users found in database.');
            return;
        }

        console.log(`\nTotal Users: ${users.length}\n`);

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   User ID: ${user.userId}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Verified: ${user.isVerified ? 'Yes ✅' : 'No ❌'}`);
            console.log(`   Created: ${user.createdAt.toLocaleString()}`);
            console.log();
        });

        console.log('='.repeat(60));
        console.log('\nTo delete a user, run this script again and enter their email.');
    } catch (error) {
        console.error('❌ Error listing users:', error.message);
    }
}

deleteUser().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
