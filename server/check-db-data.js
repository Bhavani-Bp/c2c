const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
    console.log('\n📊 DATABASE CONTENTS CHECK\n');
    console.log('═'.repeat(50));

    try {
        // Count all tables
        const userCount = await prisma.user.count();
        const roomCount = await prisma.room.count();
        const participantCount = await prisma.roomParticipant.count();
        const connectionCount = await prisma.connection.count();
        const inviteCount = await prisma.roomInvite.count();
        const notificationCount = await prisma.notification.count();

        console.log('\n📋 TABLE ROW COUNTS:\n');
        console.log(`  👥 Users:           ${userCount} rows`);
        console.log(`  🚪 Rooms:           ${roomCount} rows`);
        console.log(`  🔗 Participants:    ${participantCount} rows`);
        console.log(`  🤝 Connections:     ${connectionCount} rows`);
        console.log(`  📨 Invites:         ${inviteCount} rows`);
        console.log(`  🔔 Notifications:   ${notificationCount} rows`);

        console.log('\n' + '═'.repeat(50));

        const totalRows = userCount + roomCount + participantCount + connectionCount + inviteCount + notificationCount;

        if (totalRows === 0) {
            console.log('\n⚠️  DATABASE IS EMPTY');
            console.log('   Your backend is still using in-memory storage.');
            console.log('   Data is stored in: server/index.js (const users = {}, const rooms = {})');
            console.log('\n💡 NEXT STEP: Migrate backend to use database\n');
        } else {
            console.log(`\n✅ DATABASE HAS DATA: ${totalRows} total rows\n`);

            // Show sample data if exists
            if (userCount > 0) {
                console.log('\n👥 SAMPLE USERS:');
                const sampleUsers = await prisma.user.findMany({ take: 3 });
                sampleUsers.forEach(user => {
                    console.log(`   - ${user.name} (${user.email}) - Verified: ${user.isVerified}`);
                });
            }

            if (roomCount > 0) {
                console.log('\n🚪 SAMPLE ROOMS:');
                const sampleRooms = await prisma.room.findMany({ take: 3, include: { host: true } });
                sampleRooms.forEach(room => {
                    console.log(`   - Room ${room.roomId} - Host: ${room.host.name} - Public: ${room.isPublic}`);
                });
            }
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
