const FIREBASE_API_KEY = 'AIzaSyAyWMp0MtcQQyX21vzvVrzXJ17nucNoOhQ';
const PROJECT_ID = 'mekanik-demo-2026';

function randomStr(len = 6) {
  return Math.random().toString(36).substring(2, 2 + len);
}

async function createAccount(role, email, password, name, extraFields = {}) {
  const signupRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const signupData = await signupRes.json();
  if (!signupData.localId) {
    console.error(`❌ Error creating ${role}:`, signupData.error?.message);
    return;
  }

  const uid = signupData.localId;
  const idToken = signupData.idToken;

  const docData = {
    uid: { stringValue: uid },
    email: { stringValue: email },
    name: { stringValue: name },
    role: { stringValue: role },
    phone: { stringValue: '+234 ' + Math.floor(100000000 + Math.random() * 900000000) },
    createdAt: { stringValue: new Date().toISOString() },
    ...extraFields
  };

  const fsRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ fields: docData }),
    }
  );
  const fsData = await fsRes.json();
  if (fsData.error) {
    console.error(`❌ Firestore error for ${role}:`, fsData.error.message);
    return;
  }
  
  console.log('══════════════════════════════════════');
  console.log(`  RANDOM ${role.toUpperCase()} ACCOUNT READY`);
  console.log('══════════════════════════════════════');
  console.log(`  Email   : ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Name    : ${name}`);
  console.log('══════════════════════════════════════\\n');
}

async function main() {
  const cRand = randomStr();
  const mRand = randomStr();

  const customerEmail = `customer_${cRand}@test.com`;
  const customerPass = `Pass${cRand}!`;
  
  const mechEmail = `mechanic_${mRand}@test.com`;
  const mechPass = `Pass${mRand}!`;

  await createAccount('customer', customerEmail, customerPass, `Test Customer ${cRand}`);
  
  await createAccount('mech', mechEmail, mechPass, `Test Mechanic ${mRand}`, {
      status:      { stringValue: 'online' },
      speciality:  { stringValue: 'General Repair' },
      rating:      { doubleValue: Number((4 + Math.random()).toFixed(1)) },
      jobsDone:    { integerValue: String(Math.floor(Math.random() * 100)) },
      earnings:    { integerValue: String(Math.floor(Math.random() * 500000)) },
      acceptRate:  { integerValue: String(Math.floor(80 + Math.random() * 20)) },
      location:    {
        mapValue: { fields: {
          lat: { doubleValue: 12.0022 },
          lng: { doubleValue: 8.5920 },
          city: { stringValue: 'Kano' },
          state: { stringValue: 'Kano State' },
        }}
      },
      servicePrices: {
        mapValue: { fields: {
          serviceCharge:   { integerValue: String(Math.floor(5000 + Math.random()*5000)) },
          oilChange:       { integerValue: String(Math.floor(6000 + Math.random()*3000)) },
        }}
      }
  });
}

main().catch(console.error);
