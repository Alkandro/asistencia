// index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setAdminRole = functions.https.onCall(async (data, context) => {
 // (Opcional) Verificar que quien llama tenga rol de admin:
 if (!context.auth || context.auth.token.role !== 'admin') {
  throw new functions.https.HttpsError(
    'permission-denied',
    'Solo un usuario admin puede asignar roles.'
  );
}


  const uid = data.uid;
  await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
  return { message: `Rol de admin asignado a ${uid}` };
});
