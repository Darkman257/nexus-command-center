

const queries = [
  { msg: 'اعرض حالة نكسس', scope: 'NEXUS' },
  { msg: 'افتح أوميجا', scope: 'NEXUS' },
  { msg: 'افتح التوظيف', scope: 'NEXUS' },
  { msg: 'مين محمد؟', scope: 'NEXUS' },
  { msg: 'مين حماده؟', scope: 'NEXUS' },
  { msg: 'ايه المشاريع عندنا؟', scope: 'NEXUS' },
  { msg: 'ايه اللي اتعمل في نكسس؟', scope: 'NEXUS' },
  { msg: 'اعرض التايم لاين', scope: 'NEXUS' },
  { msg: 'راجع مشروع التوظيف', scope: 'NEXUS' },
  { msg: 'راجع أوميجا', scope: 'NEXUS' },
  { msg: 'أفضل المرشحين', scope: 'RECRUITMENT' },
  { msg: 'راجع المشاريع', scope: 'OMEGA' },
];

async function runTests() {
  console.log("Starting NOVA Router Smoke Tests...");
  for (const q of queries) {
    try {
      const res = await fetch('http://localhost:5173/api/nova/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q.msg, projectScope: q.scope, mode: 'advisor' })
      });
      const data = await res.json();
      console.log(`\n[${q.scope}] Q: ${q.msg}`);
      console.log(`Provider: ${data.provider}`);
      console.log(`Reply: ${data.reply.substring(0, 100)}...`);
    } catch (err) {
      console.error(`\n[${q.scope}] Q: ${q.msg} -> FAILED: ${err.message}`);
    }
  }
}

runTests();
