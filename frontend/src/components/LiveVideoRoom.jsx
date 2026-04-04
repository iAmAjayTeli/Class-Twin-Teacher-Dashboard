// LiveVideoRoom — Teacher's live video call UI powered by LiveKit

import { useEffect, useState, useCallback } from 'react';
import {
  LiveKitRoom,
  VideoTrack,
  useLocalParticipant,
  useTracks,
  TrackToggle,
  DisconnectButton,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

// ─── Inner component, rendered inside <LiveKitRoom> context ────────────────
function VideoConferenceInner({ onDisconnect }) {
  const { localParticipant } = useLocalParticipant();
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);

  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );

  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false }
  );

  const localCameraTrack = cameraTracks.find(t => t.participant?.isLocal);
  const localScreenTrack = screenTracks.find(t => t.participant?.isLocal);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      await localParticipant.setScreenShareEnabled(false);
      setIsScreenSharing(false);
    } else {
      await localParticipant.setScreenShareEnabled(true);
      setIsScreenSharing(true);
    }
  }, [isScreenSharing, localParticipant]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <RoomAudioRenderer />

      {/* Video Area */}
      <div style={{
        flex: 1,
        borderRadius: '20px',
        overflow: 'hidden',
        backgroundColor: '#0b0f14',
        position: 'relative',
        minHeight: '200px',
        border: '1px solid rgba(192, 193, 255, 0.15)',
        boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)',
      }}>
        {/* Screen share takes priority, else camera */}
        {localScreenTrack?.publication?.track ? (
          <VideoTrack
            trackRef={localScreenTrack}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : localCameraTrack?.publication?.track ? (
          <VideoTrack
            trackRef={localCameraTrack}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(192, 193, 255, 0.2), rgba(74, 225, 118, 0.2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--primary)' }}>videocam_off</span>
            </div>
            <p style={{ color: 'rgba(224, 226, 234, 0.5)', fontSize: '13px' }}>Camera is off</p>
          </div>
        )}

        {/* LIVE badge */}
        <div style={{
          position: 'absolute', top: '12px', left: '12px',
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '999px',
          backgroundColor: 'rgba(220, 38, 38, 0.85)',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>LIVE</span>
        </div>

        {/* Screen share badge */}
        {isScreenSharing && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            padding: '4px 12px', borderRadius: '999px',
            backgroundColor: 'rgba(74, 225, 118, 0.2)',
            border: '1px solid rgba(74, 225, 118, 0.4)',
            fontSize: '10px', fontWeight: 700, color: 'var(--secondary)',
          }}>
            Screen Sharing
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '8px',
        backgroundColor: 'rgba(24, 28, 33, 0.7)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(99, 102, 241, 0.15)',
      }}>
        {/* Mic toggle */}
        <TrackToggle
          source={Track.Source.Microphone}
          onChange={(enabled) => setIsMicOn(enabled)}
          style={{ /* hide default track toggle UI, we override below */ display: 'none' }}
        />
        <button
          onClick={() => {
            localParticipant.setMicrophoneEnabled(!isMicOn);
            setIsMicOn(v => !v);
          }}
          title={isMicOn ? 'Mute' : 'Unmute'}
          style={{
            width: '44px', height: '44px', borderRadius: '50%', border: 'none', cursor: 'pointer',
            backgroundColor: isMicOn ? 'rgba(192, 193, 255, 0.1)' : 'rgba(255, 80, 80, 0.2)',
            color: isMicOn ? 'var(--primary)' : '#ff5050',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {isMicOn ? 'mic' : 'mic_off'}
          </span>
        </button>

        {/* Camera toggle */}
        <button
          onClick={() => {
            localParticipant.setCameraEnabled(!isCamOn);
            setIsCamOn(v => !v);
          }}
          title={isCamOn ? 'Turn off camera' : 'Turn on camera'}
          style={{
            width: '44px', height: '44px', borderRadius: '50%', border: 'none', cursor: 'pointer',
            backgroundColor: isCamOn ? 'rgba(192, 193, 255, 0.1)' : 'rgba(255, 80, 80, 0.2)',
            color: isCamOn ? 'var(--primary)' : '#ff5050',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {isCamOn ? 'videocam' : 'videocam_off'}
          </span>
        </button>

        {/* Screen share */}
        <button
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          style={{
            width: '44px', height: '44px', borderRadius: '50%', border: 'none', cursor: 'pointer',
            backgroundColor: isScreenSharing ? 'rgba(74, 225, 118, 0.2)' : 'rgba(192, 193, 255, 0.1)',
            color: isScreenSharing ? 'var(--secondary)' : 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {isScreenSharing ? 'stop_screen_share' : 'screen_share'}
          </span>
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(70, 69, 84, 0.3)' }} />

        {/* End call */}
        <DisconnectButton
          onClick={onDisconnect}
          style={{
            padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            backgroundColor: 'rgba(220, 38, 38, 0.8)',
            color: '#fff', fontSize: '13px', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call_end</span>
          End Stream
        </DisconnectButton>
      </div>
    </div>
  );
}

// ─── Public component ───────────────────────────────────────────────────────
export default function LiveVideoRoom({ token, serverUrl, onDisconnect }) {
  if (!token || !serverUrl) {
    return (
      <div style={{
        width: '100%', height: '260px', borderRadius: '20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
        backgroundColor: 'rgba(11, 15, 20, 0.5)',
        border: '2px dashed rgba(192, 193, 255, 0.1)',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'rgba(192, 193, 255, 0.2)' }}>videocam</span>
        <p style={{ color: 'rgba(224, 226, 234, 0.3)', fontSize: '13px' }}>Video will appear when stream starts</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={true}
      video={true}
      onDisconnected={onDisconnect}
      style={{ width: '100%', height: '100%' }}
    >
      <VideoConferenceInner onDisconnect={onDisconnect} />
    </LiveKitRoom>
  );
}
