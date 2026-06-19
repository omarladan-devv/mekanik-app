// Seed script: creates mechanic account + Firestore profile
// Run with: node seed.js

const FIREBASE_API_KEY = 'AIzaSyAyWMp0MtcQQyX21vzvVrzXJ17nucNoOhQ';
const PROJECT_ID = 'mekanik-demo-2026';

async function main() {
  console.log('🔧 Creating mechanic account...');

  // 1. Create Firebase Auth user
  const signupRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'omarladan90@gmail.com',
        password: 'Mekanic2026!',
        returnSecureToken: true,
      }),
    }
  );
  const signupData = await signupRes.json();
  if (!signupData.localId) {
    // Already exists - try to sign in to get UID
    console.log('Account may already exist, trying to sign in...');
    const signinRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'omarladan90@gmail.com',
          password: 'Mekanic2026!',
          returnSecureToken: true,
        }),
      }
    );
    const signinData = await signinRes.json();
    if (!signinData.localId) {
      console.error('❌ Error:', signinData.error?.message || 'Unknown error');
      return;
    }
    signupData.localId   = signinData.localId;
    signupData.idToken   = signinData.idToken;
    console.log('✅ Signed in as existing user:', signupData.localId);
  } else {
    console.log('✅ Created auth user:', signupData.localId);
  }

  const uid     = signupData.localId;
  const idToken = signupData.idToken;

  // 2. Write Firestore user profile
  const firestoreDoc = {
    fields: {
      uid:         { stringValue: uid },
      email:       { stringValue: 'omarladan90@gmail.com' },
      name:        { stringValue: 'Omar Ladan' },
      role:        { stringValue: 'mech' },
      phone:       { stringValue: '+234 803 456 7890' },
      status:      { stringValue: 'online' },
      speciality:  { stringValue: 'Battery & Electrical' },
      rating:      { doubleValue: 4.9 },
      jobsDone:    { integerValue: '218' },
      earnings:    { integerValue: '840000' },
      acceptRate:  { integerValue: '96' },
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
          serviceCharge:   { integerValue: '8000' },
          batteryReplace:  { integerValue: '35000' },
          wiringRepair:    { integerValue: '12000' },
          starterMotor:    { integerValue: '28000' },
          alternator:      { integerValue: '45000' },
          oilChange:       { integerValue: '7500' },
          tireChange:      { integerValue: '5000' },
        }}
      },
      createdAt:   { stringValue: new Date().toISOString() },
    }
  };

  const fsRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(firestoreDoc),
    }
  );
  const fsData = await fsRes.json();
  if (fsData.error) {
    console.error('❌ Firestore error:', fsData.error.message);
    return;
  }

  console.log('✅ Firestore profile created!');
  console.log('');
  console.log('══════════════════════════════════════');
  console.log('  MECHANIC ACCOUNT READY');
  console.log('══════════════════════════════════════');
  console.log('  Email   : omarladan90@gmail.com');
  console.log('  Password: Mekanic2026!');
  console.log('  Name    : Omar Ladan');
  console.log('  Location: Kano State, Nigeria');
  console.log('  Role    : Mechanic 🔧');
  console.log('══════════════════════════════════════');
}

main().catch(console.error);
