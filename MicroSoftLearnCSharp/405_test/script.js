class EnhancedMusicGenerator {
  constructor() {
    this.setupAudioContext();
    this.setupElements();
    this.setupEventListeners();
    this.loadSavedMusic();

    this.isPlaying = false;
    this.currentComposition = null;
    this.savedCompositions = [];
    this.progressBar = document.getElementById('progressBar');
    this.progressContainer = document.getElementById('progressContainer');
    this.setupVisualization();
  }

  setupAudioContext() {
    this.instruments = {
      piano: new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "sine"
        },
        envelope: {
          attack: 0.05,
          decay: 0.2,
          sustain: 0.2,
          release: 1
        },
        volume: -8
      }).toDestination(),
      pad: new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.5,
          decay: 0.3,
          sustain: 0.4,
          release: 2
        },
        volume: -12
      }).toDestination(),
      bell: new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 1.5,
        modulationIndex: 3,
        envelope: {
          attack: 0.1,
          decay: 0.2,
          sustain: 0.1,
          release: 1.2
        },
        volume: -15
      }).toDestination()
    };
  }

  setupElements() {
    this.imageInput = document.getElementById('imageInput');
    this.generateButton = document.getElementById('generateButton');
    this.playButton = document.getElementById('playButton');
    this.stopButton = document.getElementById('stopButton');
    this.saveButton = document.getElementById('saveButton');
    this.canvas = document.getElementById('imageCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.playlist = document.getElementById('playlist');
    this.instrumentSelect = document.getElementById('instrumentSelect');
  }

  setupEventListeners() {
    this.imageInput.addEventListener('change', () => this.handleImageUpload());
    this.generateButton.addEventListener('click', () => this.generateMusic());
    this.playButton.addEventListener('click', () => this.togglePlay());
    this.stopButton.addEventListener('click', () => this.stopMusic());
    this.saveButton.addEventListener('click', () => this.saveComposition());
  }

  async handleImageUpload() {
    const file = this.imageInput.files[0];
    if (file) {
      this.stopMusic();

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.ctx.drawImage(img, 0, 0);
          this.generateButton.disabled = false;
          this.updateBackground(e.target.result);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  updateBackground(imageUrl) {
    document.querySelector('.background-overlay').style.backgroundImage = `url(${imageUrl})`;
  }

  analyzeImage() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    // Enhanced image analysis
    const analysis = {
      colors: [],
      brightness: [],
      sections: [],
      dominantColors: this.getDominantColors(data)
    };

    // Divide image into 16 sections for more complex analysis
    const sectionWidth = this.canvas.width / 4;
    const sectionHeight = this.canvas.height / 4;

    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const section = this.analyzeSectionData(data, x, y, sectionWidth, sectionHeight);
        analysis.sections.push(section);
      }
    }

    return analysis;
  }

  getDominantColors(data) {
    const colorMap = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
      colorMap.set(color, (colorMap.get(color) || 0) + 1);
    }
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0].split(',').map(Number));
  }

  analyzeSectionData(data, x, y, sectionWidth, sectionHeight) {
    // Calculate average color and brightness for each section
    let totalR = 0, totalG = 0, totalB = 0;
    const pixels = [];

    for (let i = y * sectionHeight; i < (y + 1) * sectionHeight; i++) {
      for (let j = x * sectionWidth; j < (x + 1) * sectionWidth; j++) {
        const idx = (i * this.canvas.width + j) * 4;
        totalR += data[idx];
        totalG += data[idx + 1];
        totalB += data[idx + 2];
        pixels.push([data[idx], data[idx + 1], data[idx + 2]]);
      }
    }

    return {
      averageColor: [
        totalR / (sectionWidth * sectionHeight),
        totalG / (sectionWidth * sectionHeight),
        totalB / (sectionWidth * sectionHeight)
      ],
      pixels: pixels
    };
  }

  async generateMusic() {
    this.progressContainer.style.display = 'block';
    this.progressBar.style.width = '0%';

    // Simulate progress steps
    for (let i = 0; i <= 100; i += 20) {
      this.progressBar.style.width = i + '%';
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const analysis = this.analyzeImage();
    const composition = this.createComposition(analysis);
    this.currentComposition = composition;

    // Ensure audio context is ready
    if (Tone.context.state === 'suspended') {
      await Tone.context.resume();
    }

    this.progressBar.style.width = '100%';
    setTimeout(() => {
      this.progressContainer.style.display = 'none';
    }, 500);

    this.playButton.disabled = false;
    this.stopButton.disabled = false;
    this.saveButton.disabled = false;
  }

  createComposition(analysis) {
    const composition = {
      id: Date.now(),
      tracks: [],
      tempo: this.calculateTempo(analysis),
      imageData: this.canvas.toDataURL(),
      duration: 32 // 32 beats
    };

    // Create multiple tracks based on image analysis
    const scales = this.createScales(analysis);
    composition.tracks.push(this.createTrack(analysis, scales[0], 'piano'));
    composition.tracks.push(this.createTrack(analysis, scales[1], 'pad'));
    composition.tracks.push(this.createTrack(analysis, scales[2], 'bell'));

    return composition;
  }

  createScales(analysis) {
    // Create different scales based on image characteristics
    const scales = [
      ['C4', 'D4', 'E4', 'G4', 'A4'],  // Pentatonic
      ['C3', 'E3', 'G3', 'B3', 'D4'],  // Major chord progression
      ['A3', 'C4', 'D4', 'E4', 'G4'],  // Minor progression
    ];

    // Modify scales based on image brightness
    const averageBrightness = analysis.sections.reduce((sum, section) =>
      sum + (section.averageColor[0] + section.averageColor[1] + section.averageColor[2]) / 3, 0
    ) / analysis.sections.length;

    // Transpose scales based on brightness
    const transpose = Math.floor(averageBrightness / 51) - 2; // -2 to +2 range
    return scales.map(scale =>
      scale.map(note => this.transposeNote(note, transpose))
    );
  }

  transposeNote(note, semitones) {
    const noteMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteRegex = /([A-G]#?)(\d+)/;
    const [, pitch, octave] = noteRegex.exec(note);

    let noteIndex = noteMap.indexOf(pitch);
    let octaveNum = parseInt(octave);

    noteIndex += semitones;
    while (noteIndex >= 12) {
      noteIndex -= 12;
      octaveNum++;
    }
    while (noteIndex < 0) {
      noteIndex += 12;
      octaveNum--;
    }

    return `${noteMap[noteIndex]}${octaveNum}`;
  }

  createTrack(analysis, scale, instrument) {
    const track = {
      instrument: instrument,
      notes: [],
      rhythm: []
    };

    // Simplified rhythm pattern for clearer piano sound
    const rhythmPatterns = [
      [1, 1, 1, 1],  // Quarter notes
      [0.5, 0.5, 1, 1],  // Mix of eighth and quarter notes
    ];

    const selectedPattern = rhythmPatterns[Math.floor(Math.random() * rhythmPatterns.length)];
    let currentBeat = 0;

    while (currentBeat < 32) {
      analysis.sections.forEach(section => {
        const brightness = (section.averageColor[0] + section.averageColor[1] + section.averageColor[2]) / 3;
        const noteIndex = Math.floor((brightness / 255) * scale.length);
        const note = scale[noteIndex];

        selectedPattern.forEach(duration => {
          if (currentBeat < 32) {
            track.notes.push(note);
            track.rhythm.push(duration);
            currentBeat += duration;
          }
        });
      });
    }

    return track;
  }

  calculateTempo(analysis) {
    // Calculate tempo based on average brightness and color variation
    const avgBrightness = analysis.sections.reduce((sum, section) =>
      sum + (section.averageColor[0] + section.averageColor[1] + section.averageColor[2]) / 3, 0
    ) / analysis.sections.length;

    // Map brightness to tempo range (80-140 BPM)
    return Math.floor(80 + (avgBrightness / 255) * 60);
  }

  async togglePlay() {
    if (!this.isPlaying) {
      await this.playMusic();
    } else {
      this.stopMusic();
    }
  }

  async playMusic() {
    if (!this.currentComposition || this.isPlaying) return;

    try {
      // Initialize Tone.js if needed
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      this.isPlaying = true;
      this.playButton.innerHTML = '<i class="fas fa-pause"></i>';

      // Clean up existing playback
      Tone.Transport.stop();
      Tone.Transport.cancel();

      // Set tempo
      Tone.Transport.bpm.value = this.currentComposition.tempo;

      // Create new loops for each track
      this.activeLoops = this.currentComposition.tracks.map(track => {
        let noteIndex = 0;
        const instrument = this.instruments[track.instrument];

        return new Tone.Loop((time) => {
          if (noteIndex >= track.notes.length) noteIndex = 0;

          const velocity = 0.3 + Math.random() * 0.3;
          instrument.triggerAttackRelease(
            track.notes[noteIndex],
            track.rhythm[noteIndex] + "n",
            time,
            velocity
          );

          noteIndex++;
        }, "4n").start(0);
      });

      Tone.Transport.start();
      this.drawWaveform();
      this.drawBarGraph();
    } catch (error) {
      console.error('Playback error:', error);
      this.stopMusic();
    }
  }

  stopMusic() {
    this.isPlaying = false;
    this.playButton.innerHTML = '<i class="fas fa-play"></i>';

    // Stop and cleanup transport
    Tone.Transport.stop();
    Tone.Transport.cancel();

    // Clean up loops
    if (this.activeLoops) {
      this.activeLoops.forEach(loop => loop.dispose());
      this.activeLoops = [];
    }

    // Reset all instruments
    Object.values(this.instruments).forEach(instrument => {
      instrument.releaseAll();
    });

    this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
    this.barGraphCtx.clearRect(0, 0, this.barGraphCanvas.width, this.barGraphCanvas.height);
  }

  saveComposition() {
    if (!this.currentComposition) return;

    const composition = {
      ...this.currentComposition,
      name: `Composition ${this.savedCompositions.length + 1}`,
      date: new Date().toLocaleString()
    };

    this.savedCompositions.push(composition);
    this.saveToLocalStorage();
    this.updatePlaylist();
  }

  loadSavedMusic() {
    const saved = localStorage.getItem('savedCompositions');
    if (saved) {
      this.savedCompositions = JSON.parse(saved);
      this.updatePlaylist();
    }
  }

  saveToLocalStorage() {
    localStorage.setItem('savedCompositions', JSON.stringify(this.savedCompositions));
  }

  updatePlaylist() {
    this.playlist.innerHTML = '';

    this.savedCompositions.forEach((composition, index) => {
      const item = document.createElement('div');
      item.className = 'playlist-item';

      item.innerHTML = `
                <img src="${composition.imageData}" alt="Composition thumbnail">
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${composition.name}</div>
                    <div class="playlist-item-date">${composition.date}</div>
                </div>
                <div class="playlist-controls">
                    <button onclick="musicGenerator.playComposition(${index})">
                        <i class="fas fa-play"></i>
                    </button>
                    <button onclick="musicGenerator.deleteComposition(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

      this.playlist.appendChild(item);
    });
  }

  playComposition(index) {
    this.stopMusic();
    this.currentComposition = this.savedCompositions[index];
    this.playMusic();
  }

  deleteComposition(index) {
    this.savedCompositions.splice(index, 1);
    this.saveToLocalStorage();
    this.updatePlaylist();
  }

  setupVisualization() {
    this.waveformCanvas = document.getElementById('waveformCanvas');
    this.waveformCtx = this.waveformCanvas.getContext('2d');
    this.barGraphCanvas = document.getElementById('barGraphCanvas');
    this.barGraphCtx = this.barGraphCanvas.getContext('2d');
    this.analyzer = new Tone.Analyser('waveform', 256);
    this.fft = new Tone.Analyser('fft', 32);

    // Connect all instruments to analyzers
    Object.values(this.instruments).forEach(instrument => {
      instrument.connect(this.analyzer);
      instrument.connect(this.fft);
    });

    // Set canvas size
    this.resizeWaveformCanvas();
    this.resizeBarGraphCanvas();
    window.addEventListener('resize', () => {
      this.resizeWaveformCanvas();
      this.resizeBarGraphCanvas();
    });
  }

  resizeWaveformCanvas() {
    this.waveformCanvas.width = this.waveformCanvas.offsetWidth;
    this.waveformCanvas.height = this.waveformCanvas.offsetHeight;
  }

  resizeBarGraphCanvas() {
    this.barGraphCanvas.width = this.barGraphCanvas.offsetWidth;
    this.barGraphCanvas.height = this.barGraphCanvas.offsetHeight;
  }

  drawWaveform() {
    if (!this.isPlaying) return;

    requestAnimationFrame(() => this.drawWaveform());

    const waveform = this.analyzer.getValue();
    const width = this.waveformCanvas.width;
    const height = this.waveformCanvas.height;
    const sliceWidth = width / waveform.length;

    this.waveformCtx.clearRect(0, 0, width, height);
    this.waveformCtx.beginPath();
    this.waveformCtx.strokeStyle = 'var(--primary-color)';
    this.waveformCtx.lineWidth = 2;

    waveform.forEach((value, i) => {
      const x = i * sliceWidth;
      const y = (value + 1) / 2 * height;

      if (i === 0) {
        this.waveformCtx.moveTo(x, y);
      } else {
        this.waveformCtx.lineTo(x, y);
      }
    });

    this.waveformCtx.stroke();
  }

  drawBarGraph() {
    if (!this.isPlaying) return;

    requestAnimationFrame(() => this.drawBarGraph());

    const values = this.fft.getValue();
    const width = this.barGraphCanvas.width;
    const height = this.barGraphCanvas.height;
    const barWidth = width / values.length;

    this.barGraphCtx.clearRect(0, 0, width, height);

    values.forEach((value, i) => {
      const barHeight = (value + 140) * 2; // Normalize value
      const x = i * barWidth;
      const y = height - barHeight;

      this.barGraphCtx.fillStyle = 'var(--primary-color)';
      this.barGraphCtx.fillRect(x, y, barWidth, barHeight);
    });
  }
}

// Initialize the application
let musicGenerator;
document.addEventListener('DOMContentLoaded', () => {
  musicGenerator = new EnhancedMusicGenerator();
});