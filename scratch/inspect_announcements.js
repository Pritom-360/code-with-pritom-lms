const db = require('../db');

async function run() {
    console.log('🔍 Inspecting Announcements Table...');
    try {
        const { data, error } = await db.from('announcements')
            .select('*')
            .limit(3);
        
        if (error) {
            console.error('❌ Fetch Error:', error);
            return;
        }

        console.log('📊 Columns Sample:');
        if (data.length > 0) {
            console.log(Object.keys(data[0]));
            console.log('\n📄 Sample Record:', data[0]);
        } else {
            console.log('⚠️ No records in announcements!');
        }

        // Let's check what happens with time filters
        const nowStr = new Date().toISOString();
        console.log('\n🕒 Node nowStr:', nowStr);
        
        const { data: activeList, error: filterErr } = await db.from('announcements')
            .select('*')
            .eq('status', 'active')
            .limit(5);
            
        if (filterErr) {
            console.error('❌ Active Filter Error:', filterErr);
        } else {
            console.log('\n📋 Active Status Records:');
            activeList.forEach(r => {
                console.log(`- ID: ${r.id}, Title: ${r.title}, Status: ${r.status}, Start: ${r.start_date}, End: ${r.end_date}`);
            });
        }

    } catch (e) {
        console.error('💥 Crash:', e);
    }
}

run();
