const msgs = ['مين محمد؟', 'مين حماده؟', 'نوفا تعرف ايه؟', 'ايه قراراتنا؟', 'ايه اللي اتعمل في نكسس؟', 'ايه علاقة أوميجا بنكسس؟', 'ايه الأنظمة اللي عندنا؟', 'اعرض التايم لاين'];
async function test() {
  for (const msg of msgs) {
    const res = await fetch('http://localhost:5174/api/nova/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, projectScope: 'NEXUS', mode: 'advisor' })
    });
    const data = await res.json();
    console.log('Q:', msg);
    console.log('A:', data.reply);
    console.log('Provider:', data.provider);
    console.log('----------------');
  }
}
test();
