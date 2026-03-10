import { Store, state } from "@helfy/helfy";
import type { VideoCallState } from "@interfaces/chat";
import type { VideoStore } from "./interfaces";

@Store<VideoStore>()
export class VideoStoreImpl implements VideoStore {
  @state videoCallState: VideoCallState = "idle";
  @state localStream: MediaStream | null = null;
  @state remoteStream: MediaStream | null = null;
  @state incomingCallFrom: string | null = null;
  @state videoError: string | null = null;

  setVideoCallState(state: VideoCallState) {
    this.videoCallState = state;
  }

  setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
  }

  setRemoteStream(stream: MediaStream | null) {
    this.remoteStream = stream;
  }

  setIncomingCallFrom(peerId: string | null) {
    this.incomingCallFrom = peerId;
  }

  setVideoError(msg: string | null) {
    this.videoError = msg;
  }

  clearVideoError() {
    this.videoError = null;
    if (this.videoCallState === "error") {
      this.videoCallState = "idle";
    }
  }

  reset() {
    this.stopAllTracks();
    this.videoCallState = "idle";
    this.localStream = null;
    this.remoteStream = null;
    this.incomingCallFrom = null;
    this.videoError = null;
  }

  private stopAllTracks() {
    [this.localStream, this.remoteStream].forEach((stream) => {
      stream?.getTracks().forEach((t) => t.stop());
    });
  }
}
