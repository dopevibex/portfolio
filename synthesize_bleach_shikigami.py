import math
import struct
import wave
import os

def generate_shikigami_soundtrack(output_path, duration_seconds=32, sample_rate=44100):
    """
    Synthesizes a 32-second seamless looping dark gothic theme inspired by Bleach OST (Shikigami / Soundscape to Ardor / Treachery vibe):
    - Haunting music box / eerie celesta chime arpeggio in D harmonic minor (D, F, A, Bb, C#, D)
    - Dark sustained cello/bass drone in D minor with deep sub-bass pulse
    - Demonic atmospheric choral resonance and slow sweeping phaser pad
    - Chilling reverse-tail reverb reflections
    """
    num_samples = int(duration_seconds * sample_rate)
    
    # 2 channels (stereo)
    left_channel = [0.0] * num_samples
    right_channel = [0.0] * num_samples

    # 1. Dark Bass Drone & Sub-Bass (D1 ~ 36.71 Hz, D2 ~ 73.42 Hz, A1 ~ 55.0 Hz)
    drone_notes = [(36.71, 0.25), (73.42, 0.20), (110.0, 0.12), (146.83, 0.08)]
    for freq, amp in drone_notes:
        for i in range(num_samples):
            t = i / sample_rate
            # subtle slow LFO modulation
            lfo = 1.0 + 0.15 * math.sin(2 * math.pi * 0.12 * t)
            sub = amp * math.sin(2 * math.pi * freq * t) * lfo
            left_channel[i] += sub
            right_channel[i] += sub

    # 2. Haunting Bleach Minor Arpeggio Sequence (Celesta / Chime / Gothic Music Box)
    # Scale: D minor / D harmonic minor
    # Notes: D4 (293.66), F4 (349.23), A4 (440.0), Bb4 (466.16), G4 (392.0), F4 (349.23), E4 (329.63), C#4 (277.18)
    melody_notes = [
        # Bar 1 (0 - 4s)
        (0.0, 293.66, 0.8), (0.5, 349.23, 0.7), (1.0, 440.00, 0.85), (1.5, 466.16, 0.75),
        (2.0, 440.00, 0.8), (2.5, 392.00, 0.7), (3.0, 349.23, 0.75), (3.5, 329.63, 0.7),
        # Bar 2 (4 - 8s)
        (4.0, 293.66, 0.8), (4.5, 349.23, 0.7), (5.0, 440.00, 0.85), (5.5, 554.37, 0.85), # C#5 (haunting harmonic minor tension)
        (6.0, 523.25, 0.8), (6.5, 466.16, 0.75), (7.0, 440.00, 0.8), (7.5, 370.00, 0.7),
        # Bar 3 (8 - 12s)
        (8.0, 293.66, 0.8), (8.5, 349.23, 0.7), (9.0, 440.00, 0.85), (9.5, 466.16, 0.75),
        (10.0, 587.33, 0.9), (10.5, 554.37, 0.85), (11.0, 466.16, 0.75), (11.5, 440.00, 0.8),
        # Bar 4 (12 - 16s)
        (12.0, 392.00, 0.75), (12.5, 349.23, 0.7), (13.0, 329.63, 0.7), (13.5, 277.18, 0.85), # C#4
        (14.0, 293.66, 0.95), (15.0, 440.00, 0.7),
    ]

    # Repeat melody for 32 seconds (2 cycles)
    full_melody = []
    for cycle in range(2):
        offset = cycle * 16.0
        for start_t, freq, velocity in melody_notes:
            full_melody.append((start_t + offset, freq, velocity))

    for start_t, freq, velocity in full_melody:
        start_idx = int(start_t * sample_rate)
        # Note duration & decay
        note_len = int(2.5 * sample_rate) # Long ring out
        end_idx = min(num_samples, start_idx + note_len)
        
        # Pan alternating left/right slightly for spacious stereo
        pan = 0.5 + 0.3 * math.sin(start_t * 1.5)
        
        for i in range(start_idx, end_idx):
            t_rel = (i - start_idx) / sample_rate
            # Exponential decay envelope with chime attack
            env = math.exp(-3.2 * t_rel) * velocity * 0.22
            
            # Chime / Music Box timbre: fundamental + glass harmonics
            s = (
                0.60 * math.sin(2 * math.pi * freq * t_rel) +
                0.25 * math.sin(2 * math.pi * freq * 2.0 * t_rel) +
                0.15 * math.sin(2 * math.pi * freq * 3.01 * t_rel) +
                0.08 * math.sin(2 * math.pi * freq * 4.02 * t_rel)
            ) * env
            
            # Stereo distribution
            left_channel[i] += s * (1.0 - pan)
            right_channel[i] += s * pan

    # 3. Demonic Ambient Pad & Spectral Wind (C# / D / A haunting dissonances)
    for i in range(num_samples):
        t = i / sample_rate
        # Slow sweeping filter frequencies
        sw1 = math.sin(2 * math.pi * 0.08 * t)
        sw2 = math.cos(2 * math.pi * 0.05 * t)
        
        pad = (
            0.06 * math.sin(2 * math.pi * (220.0 + 1.2 * sw1) * t) +
            0.05 * math.sin(2 * math.pi * (277.18 + 0.8 * sw2) * t) +
            0.04 * math.sin(2 * math.pi * (440.0 + 2.0 * sw1) * t)
        ) * (1.0 + 0.2 * math.sin(2 * math.pi * 0.25 * t))
        
        left_channel[i] += pad * 0.8
        right_channel[i] += pad * 0.8

    # 4. Stereo Reverb Delay Simulation
    delay_samples = int(0.38 * sample_rate)
    decay = 0.38
    for i in range(delay_samples, num_samples):
        left_channel[i] += right_channel[i - delay_samples] * decay
        right_channel[i] += left_channel[i - delay_samples] * decay

    # 5. Normalization & Clipping Prevention
    max_val = 0.0001
    for i in range(num_samples):
        max_val = max(max_val, abs(left_channel[i]), abs(right_channel[i]))

    gain = 0.88 / max_val
    
    # Pack into 16-bit PCM WAV
    wav_file = wave.open(output_path, 'w')
    wav_file.setnchannels(2)
    wav_file.setsampwidth(2)
    wav_file.setframerate(sample_rate)
    
    frames = bytearray()
    for i in range(num_samples):
        l_sample = int(max(-32767, min(32767, left_channel[i] * gain * 32767)))
        r_sample = int(max(-32767, min(32767, right_channel[i] * gain * 32767)))
        frames.extend(struct.pack('<hh', l_sample, r_sample))
        
    wav_file.writeframes(frames)
    wav_file.close()
    print(f"Generated soundtrack at {output_path} ({duration_seconds}s, {sample_rate}Hz)")

out_audio = r"C:\Users\Puzzz\.gemini\antigravity\scratch\dope-demonic-portfolio\assets\shikigami-theme.wav"
generate_shikigami_soundtrack(out_audio)
