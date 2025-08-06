import Foundation
import AVFoundation
import SwiftUI

class SoundManager: ObservableObject {
    private var audioEngine = AVAudioEngine()
    private var player = AVAudioPlayerNode()
    private var mixer = AVAudioMixerNode()

    @Published var volume: Float = 0.5
    @Published var soundEnabled = true

    init() {
        setupAudioEngine()
    }

    private func setupAudioEngine() {
        // Attach nodes
        audioEngine.attach(player)
        audioEngine.attach(mixer)

        // Connect nodes
        audioEngine.connect(player, to: mixer, format: nil)
        audioEngine.connect(mixer, to: audioEngine.outputNode, format: nil)

        // Start engine
        do {
            try audioEngine.start()
        } catch {
            print("Failed to start audio engine: \(error)")
        }
    }

    func playStartSound() {
        guard soundEnabled else { return }
        generateRetroTick()
    }

    func playCompleteSound() {
        guard soundEnabled else { return }
        generateRetroComplete()
    }

    func playBreakSound() {
        guard soundEnabled else { return }
        generateRetroBreak()
    }

    private func generateRetroTick() {
        let sampleRate = 44100.0
        let frameCount = AVAudioFrameCount(sampleRate * 0.1) // 0.1 second

        guard let buffer = AVAudioPCMBuffer(pcmFormat: AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!, frameCapacity: frameCount) else {
            return
        }

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

        guard let buffer = AVAudioPCMBuffer(pcmFormat: AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!, frameCapacity: frameCount) else {
            return
        }

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

        guard let buffer = AVAudioPCMBuffer(pcmFormat: AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!, frameCapacity: frameCount) else {
            return
        }

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
}