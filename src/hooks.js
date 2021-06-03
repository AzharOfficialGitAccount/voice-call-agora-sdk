import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import RtcEngine from 'react-native-agora';
import { requestAudioPermission } from './permissions';

export const useRequestAudioHook = () => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      requestAudioPermission().then(() => {
        console.log('requested!');
      });
    }
  }, []);
};

export const useInitializeAgora = () => {
  const appId = 'dc19d61c5fc34852920103b354151681';
  const token =
    '006dc19d61c5fc34852920103b354151681IADPiicA74WMT5FbATnbmGF5IPIzXPoPvRUz/twkBbt90xv7mqYAAAAAEAA8g5F55aywYAEAAQDhrLBg';

  const [channelName, setChannelName] = useState('innerdots');
  const [joinSucceed, setJoinSucceed] = useState(false);
  const [peerIds, setPeerIds] = useState([]);
  const [isMute, setIsMute] = useState(false);
  const [isSpeakerEnable, setIsSpeakerEnable] = useState(true);
  const rtcEngine = useRef(null);

  const initAgora = useCallback(async () => {
    rtcEngine.current = await RtcEngine.create(appId);

    await rtcEngine.current?.enableAudio();
    await rtcEngine.current?.muteLocalAudioStream(false);
    await rtcEngine.current?.setEnableSpeakerphone(true);

    rtcEngine.current?.addListener('UserJoined', (uid, elapsed) => {
      console.log('UserJoined', uid, elapsed);

      setPeerIds((peerIdsLocal) => {
        if (peerIdsLocal.indexOf(uid) === -1) {
          return [...peerIdsLocal, uid];
        }

        return peerIdsLocal;
      });
    });

    rtcEngine.current?.addListener('UserOffline', (uid, reason) => {
      console.log('UserOffline', uid, reason);

      setPeerIds((peerIdsLocal) => {
        return peerIdsLocal.filter((id) => id !== uid);
      });
    });

    rtcEngine.current?.addListener(
      'JoinChannelSuccess',
      (channel, uid, elapsed) => {
        console.log('JoinChannelSuccess', channel, uid, elapsed);

        setJoinSucceed(true);

        setPeerIds((peerIdsLocal) => {
          return [...peerIdsLocal, uid];
        });
      },
    );

    rtcEngine.current?.addListener('Error', (error) => {
      console.log('Error', error);
    });
  }, []);

  const joinChannel = useCallback(async () => {
    await rtcEngine.current?.joinChannel(token, channelName, null, 0);
  }, [channelName]);

  const leaveChannel = useCallback(async () => {
    await rtcEngine.current?.leaveChannel();

    setPeerIds([]);
    setJoinSucceed(false);
  }, []);

  const toggleIsMute = useCallback(async () => {
    await rtcEngine.current?.muteLocalAudioStream(!isMute);
    setIsMute(!isMute);
  }, [isMute]);

  const toggleIsSpeakerEnable = useCallback(async () => {
    await rtcEngine.current?.setEnableSpeakerphone(!isSpeakerEnable);
    setIsSpeakerEnable(!isSpeakerEnable);
  }, [isSpeakerEnable]);

  const destroyAgoraEngine = useCallback(async () => {
    await rtcEngine.current?.destroy();
  }, []);

  useEffect(() => {
    initAgora();

    return () => {
      destroyAgoraEngine();
    };
  }, [destroyAgoraEngine, initAgora]);

  return {
    channelName,
    isMute,
    isSpeakerEnable,
    joinSucceed,
    peerIds,
    setChannelName,
    joinChannel,
    leaveChannel,
    toggleIsMute,
    toggleIsSpeakerEnable,
  };
};
