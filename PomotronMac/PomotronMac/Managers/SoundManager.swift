import Foundation
import AVFoundation
import SwiftUI

class SoundManager: ObservableObject {
    private var audioEngine = AVAudioEngine()
    private var player: AVAudioPlayerNode
    private var reverb = AVAudioUnitReverb()
    private var delay = AVAudioUnitDelay()
    
    @Published var isMuted = false
    @Published var volume: Float = 0.7
    
    init() {
        player = AVAudioPlayerNode()
        setupAudioEngine()
    }
    
    private func setupAudioEngine() {
        // Attach nodes to the audio engine
        audioEngine.attach(player)
        audioEngine.attach(reverb)
        audioEngine.attach(delay)
        
        // Configure reverb for retro synthwave effect
        reverb.loadFactoryPreset(.largeHall)
        reverb.wetDryMix = 30
        
        // Configure delay for retro effect
        delay.delayTime = 0.3
        delay.feedback = 25
        delay.wetDryMix = 20
        
        // Connect the nodes
        audioEngine.connect(player, to: delay, format: nil)
        audioEngine.connect(delay, to: reverb, format: nil)
        audioEngine.connect(reverb, to: audioEngine.mainMixerNode, format: nil)
        
        // Start the engine
        do {
            try audioEngine.start()
        } catch {
            print("Failed to start audio engine: \(error)")
        }
    }
    
    // MARK: - Retro Sound Generation
    
    func playStartSound() {
        guard !isMuted else { return }
        generateSynthwaveChord(frequencies: [220, 277, 330, 440], duration: 1.0)
    }
    
    func playPauseSound() {
        guard !isMuted else { return }
        generateSynthwaveChord(frequencies: [440, 330, 277], duration: 0.5)
    }
    
    func playCompleteSound() {
        guard !isMuted else { return }
        // Victory chord progression
        generateSynthwaveSequence()
    }
    
    func playTickSound() {
        guard !isMuted else { return }
        generateRetroTick()
    }
    
    // MARK: - Sound Generation Methods
    
    private func generateSynthwaveChord(frequencies: [Double], duration: Double) {
        let sampleRate = 44100.0
        let frameCount = AVAudioFrameCount(sampleRate * duration)
        
        guard let buffer = AVAudioPCMBuffer(pcmFormat: audioEngine.mainMixerNode.outputFormat(forBus: 0), frameCapacity: frameCount) else {
            return
        }
        
        buffer.frameLength = frameCount
        
        let channelData = buffer.floatChannelData![0]
        
        for frame in 0..<Int(frameCount) {
            let time = Double(frame) / sampleRate
            var sample: Float = 0.0
            
            // Generate multiple sine waves for chord
            for frequency in frequencies {
                let wave = sin(2.0 * Double.pi * frequency * time)
                let envelope = exp(-time * 2.0) // Exponential decay
                sample += Float(wave * envelope * 0.3) // Reduce amplitude to prevent clipping
            }
            
            // Add some retro distortion
            sample = tanh(sample * 1.5)
            
            channelData[frame] = sample * volume
        }
        
        playBuffer(buffer)
    }
    
    private func generateSynthwaveSequence() {
        // Play a sequence of chords for completion sound
        let chords: [[Double]] = [
            [220, 277, 330],  // Am
            [247, 311, 370],  // Bm
            [262, 330, 392],  // C
            [294, 370, 440]   // Dm
        ]
        
        for (index, chord) in chords.enumerated() {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(index) * 0.3) {
                self.generateSynthwaveChord(frequencies: chord, duration: 0.4)
            }
        }
    }
    
    private func generateRetroTick() {
        let sampleRate = 44100.0
        let duration = 0.1
        let frameCount = AVAudioFrameCount(sampleRate * duration)
        
        guard let buffer = AVAudioPCMBuffer(pcmFormat: audioEngine.mainMixerNode.outputFormat(forBus: 0), frameCapacity: frameCount) else {
            return
        }
        
        buffer.frameLength = frameCount
        let channelData = buffer.floatChannelData![0]
        
        for frame in 0..<Int(frameCount) {
            let time = Double(frame) / sampleRate
            
            // Generate a quick blip sound
            let frequency = 800.0
            let wave = sin(2.0 * Double.pi * frequency * time)
            let envelope = exp(-time * 50.0) // Very quick decay
            
            channelData[frame] = Float(wave * envelope * 0.2 * volume)
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
    
    func toggleMute() {
        isMuted.toggle()
    }
}