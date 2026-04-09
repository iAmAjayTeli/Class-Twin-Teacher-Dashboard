// ClassTwin LiveKit Service — Token Generation & Room Management

const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

const LIVEKIT_URL     = (process.env.LIVEKIT_URL     || 'wss://class-twin-gpmml780.livekit.cloud').trim();
const LIVEKIT_API_KEY = (process.env.LIVEKIT_API_KEY || '').trim();
const LIVEKIT_API_SECRET = (process.env.LIVEKIT_API_SECRET || '').trim();

// HTTP URL for RoomServiceClient (convert wss → https)
const httpUrl = LIVEKIT_URL.replace(/^wss?:\/\//, 'https://');
const roomService = new RoomServiceClient(httpUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

/**
 * Generate a LiveKit access token.
 * @param {string} roomName  - The LiveKit room name
 * @param {string} identity  - Unique participant identity (e.g. teacherId or studentName)
 * @param {boolean} isTeacher - Teachers can publish; students are receivers
 */
async function generateToken({ roomName, identity, isTeacher = false, name = '' }) {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name: name || identity,
    ttl: '4h',
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: isTeacher,
    canSubscribe: true,
    canPublishData: isTeacher,
    roomCreate: isTeacher,
  });

  return await at.toJwt();
}

/**
 * Create a LiveKit room via the Room Service API.
 */
async function createRoom(roomName) {
  try {
    const room = await roomService.createRoom({
      name: roomName,
      emptyTimeout: 300,   // 5 min idle before auto-close
      maxParticipants: 200,
    });
    return room;
  } catch (err) {
    console.error('LiveKit createRoom error:', err.message);
    throw err;
  }
}

/**
 * Delete / end a LiveKit room.
 */
async function deleteRoom(roomName) {
  try {
    await roomService.deleteRoom(roomName);
  } catch (err) {
    console.error('LiveKit deleteRoom error:', err.message);
  }
}

/**
 * List participants in a LiveKit room.
 * Returns empty array if the room doesn't exist.
 */
async function listParticipants(roomName) {
  try {
    const participants = await roomService.listParticipants(roomName);
    return participants || [];
  } catch (err) {
    // Room doesn't exist or API error — treat as empty
    return [];
  }
}

/**
 * Check if a teacher is actively connected in a LiveKit room.
 * Teacher identities are prefixed with 'teacher-'.
 */
async function isTeacherInRoom(roomName) {
  const participants = await listParticipants(roomName);
  return participants.some(p => p.identity && p.identity.startsWith('teacher-'));
}

module.exports = { generateToken, createRoom, deleteRoom, listParticipants, isTeacherInRoom, LIVEKIT_URL };
