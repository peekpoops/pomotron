
import Foundation
import AVFoundation
import SwiftUI

class SoundManager: ObservableObject {
    private var audioEngine = AVAudioEngine()
    private var player = AVAudioPlayerNode()
    private var mixer = AVAudioMixerNode()

    @Published var volume: Float = 0.5
    @Published var soundEnabled = true
    @Published var isMuted = false

    init() {
        setupAudioEngine()
    }

    private func setupAudioEngine() {
        do {
            // Configure audio session
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, mode: .default)
            try audioSession.setActive(true)
            
            // Attach nodes
            audioEngine.attach(player)
            audioEngine.attach(mixer)

            // Connect nodes
            audioEngine.connect(player, to: mixer, format: nil)
            audioEngine.connect(mixer, to: audioEngine.outputNode, format: nil)

            // Start engine
            try audioEngine.start()
        } catch {
            print("Failed to setup audio engine: \(error)")
            // Fallback to simpler audio or disable sounds
            soundEnabled = false
        }
    }

    func playStartSound() {
        print("SoundManager.playStartSound called - enabled: \(soundEnabled), muted: \(isMuted)")
        guard soundEnabled && !isMuted else { 
            print("Sound disabled or muted")
            return 
        }
        generateRetroTick()
    }

    func playCompleteSound() {
        guard soundEnabled && !isMuted else { return }
        generateRetroComplete()
    }

    func playBreakSound() {
        guard soundEnabled && !isMuted else { return }
        generateRetroBreak()
    }

    func playPauseSound() {
        guard soundEnabled && !isMuted else { return }
        generateRetroPause()
    }

    private func generateRetroTick() {
        let sampleRate = 44100.0
        let frameCount = AVAudioFrameCount(sampleRate * 0.1) // 0.1 second

        guard let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1) else { return }
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }

        buffer.frameLength = frameCount

        guard let channelData = buffer.floatChannelData?[0] else { return }

        for frame in 0..<Int(frameCount) {
            let time = Double(frame) / sampleRate

            // Generate a quick blip sound
            let frequency = 800.0
            let wave = sin(2.0 * Double.pi * frequency * time)
            let envelope = exp(-time * 50.0) // Very quick decay

            channelData[frame] = Float(wave * envelope * 0.2 * Double(volume))
        }

        playBuffer(buffer)
    }

    private func generateRetroComplete() {
        let sampleRate = 44100.0
        let frameCount = AVAudioFrameCount(sampleRate * 0.5) // 0.5 second

        guard let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1) else { return }
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }

        buffer.frameLength = frameCount

        guard let channelData = buffer.floatChannelData?[0] else { return }

        for frame in 0..<Int(frameCount) {
            let time = Double(frame) / sampleRate

            // Generate ascending tones
            let frequency = 400.0 + (time * 400.0) // Sweep from 400Hz to 800Hz
            let wave = sin(2.0 * Double.pi * frequency * time)
            let envelope = exp(-time * 2.0) // Slower decay

            channelData[frame] = Float(wave * envelope * 0.3 * Double(volume))
        }

        playBuffer(buffer)
    }

    private func generateRetroBreak() {
        let sampleRate = 44100.0
        let frameCount = AVAudioFrameCount(sampleRate * 0.3) // 0.3 second

        guard let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1) else { return }
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }

        buffer.frameLength = frameCount

        guard let channelData = buffer.floatChannelData?[0] else { return }

        for frame in 0..<Int(frameCount) {
            let time = Double(frame) / sampleRate

            // Generate descending tones
            let frequency = 600.0 - (time * 200.0) // Sweep from 600Hz to 400Hz
            let wave = sin(2.0 * Double.pi * frequency * time)
            let envelope = 1.0 - (time / 0.3) // Linear fade

            channelData[frame] = Float(wave * envelope * 0.25 * Double(volume))
        }

        playBuffer(buffer)
    }

    private func generateRetroPause() {
        let sampleRate = 44100.0
        let frameCount = AVAudioFrameCount(sampleRate * 0.2) // 0.2 second

        guard let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1) else { return }
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }

        buffer.frameLength = frameCount

        guard let channelData = buffer.floatChannelData?[0] else { return }

        for frame in 0..<Int(frameCount) {
            let time = Double(frame) / sampleRate

            // Generate a soft pause tone
            let frequency = 300.0
            let wave = sin(2.0 * Double.pi * frequency * time)
            let envelope = exp(-time * 8.0) // Quick fade

            channelData[frame] = Float(wave * envelope * 0.15 * Double(volume))
        }

        playBuffer(buffer)
    }

    private func playBuffer(_ buffer: AVAudioPCMBuffer) {
        if player.isPlaying {
            player.stop()
        }

        player.scheduleBuffer(buffer, at: nil, options: [], completionHandler: nil)
        player.play()
    }

    // MARK: - Settings

    func setVolume(_ newVolume: Float) {
        volume = max(0.0, min(1.0, newVolume))
    }

    func toggleSound() {
        soundEnabled.toggle()
    }

    func toggleMute() {
        isMuted.toggle()
    }
}
