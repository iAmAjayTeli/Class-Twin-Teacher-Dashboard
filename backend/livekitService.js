// ClassTwin LiveKit Service — Token Generation & Room Management

const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

const LIVEKIT_URL     = process.env.LIVEKIT_URL     || 'wss://class-twin-gpmml780.livekit.cloud';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';

// HTTP URL for RoomServiceClient (convert wss → https)
const httpUrl = LIVEKIT_URL.replace(/^wss?:\/\//, 'https://');
const roomService = new RoomServiceClient(httpUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

/**
 * Generate a LiveKit access token.
 * @param {string} roomName  - The LiveKit room name
 * @param {string} identity  - Unique participant identity (e.g. teacherId or studentName)
 * @param {boolean} isTeacher - Teachers can publish; students are receivers
 */
async function generateToken({ roomName, identity, isTeacher = false }) {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
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

module.exports = { generateToken, createRoom, deleteRoom, LIVEKIT_URL };
