const tests = [
  { msg: 'ايه اللي اتعمل في نكسس؟', scope: 'NEXUS' },
  { msg: 'راجع المشاريع', scope: 'OMEGA' },
  { msg: 'أفضل المرشحين', scope: 'RECRUITMENT' }
];

async function test() {
  for (const t of tests) {
    const res = await fetch('http://localhost:5174/api/nova/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: t.msg, projectScope: t.scope, mode: 'advisor' })
    });
    const data = await res.json();
    console.log(`Context: ${t.scope}`);
    console.log(`Q: ${t.msg}`);
    console.log(`A: ${data.reply}`);
    console.log(`Provider: ${data.provider}`);
    console.log('----------------');
  }
}
test();
