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
    this.history = [];
    this.loadHistory();
    this.setupHistoryElements();
    this.setupTimeline();
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
    this.timeline = document.querySelector('.timeline');
    this.timelineProgress = document.querySelector('.timeline-progress');
    this.timelineCursor = document.querySelector('.timeline-cursor');
    this.timelineTime = document.querySelector('.timeline-time');
    this.imageDescription = document.querySelector('.image-description');
    this.musicDescription = document.querySelector('.music-description');
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

          // Add to history
          this.addToHistory({
            imageData: e.target.result,
            date: new Date().toLocaleString(),
            filename: file.name
          });
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

    // Generate descriptions based on analysis
    this.updateDescriptions(analysis);
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

    // Add to history when music is generated
    this.addToHistory({
      imageData: this.canvas.toDataURL(),
      date: new Date().toLocaleString(),
      filename: 'Generated Music ' + new Date().toLocaleString(),
      composition: composition // Store the composition data
    });

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

      // Calculate total duration based on tempo and beats
      this.duration = (60 / this.currentComposition.tempo) * this.currentComposition.duration;

      // Update timeline periodically
      this.timelineInterval = setInterval(() => {
        this.currentTime = Tone.Transport.seconds;
        this.updateTimelinePosition();
      }, 100);

      Tone.Transport.start();
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

    this.barGraphCtx.clearRect(0, 0, this.barGraphCanvas.width, this.barGraphCanvas.height);
    if (this.timelineInterval) {
      clearInterval(this.timelineInterval);
    }
    this.currentTime = 0;
    this.updateTimelinePosition();
    this.clearDescriptions();
  }

  saveComposition() {
    if (!this.currentComposition) {
      alert('No music to save. Please generate music first.');
      return;
    }

    try {
      // Create a simplified version of the composition for storage
      const compositionToSave = {
        id: Date.now(),
        name: `Composition ${this.savedCompositions.length + 1}`,
        date: new Date().toLocaleString(),
        imageData: this.currentComposition.imageData,
        tempo: this.currentComposition.tempo,
        duration: this.currentComposition.duration,
        tracks: this.currentComposition.tracks.map(track => ({
          instrument: track.instrument,
          notes: track.notes ? [...track.notes] : [],
          rhythm: track.rhythm ? [...track.rhythm] : []
        }))
      };

      // Check if composition data is valid
      if (!compositionToSave.tracks || !compositionToSave.tracks.length) {
        throw new Error('Invalid composition data');
      }

      // Check for duplicate saves
      const isDuplicate = this.savedCompositions.some(comp => comp.id === compositionToSave.id);
      if (isDuplicate) {
        alert('This composition is already saved!');
        return;
      }

      // Add to saved compositions array
      this.savedCompositions.push(compositionToSave);

      // Save to localStorage
      this.saveToLocalStorage();

      // Update UI
      this.updatePlaylist();

      // Show success message
      alert('Music saved to collection!');

    } catch (error) {
      console.error('Error saving composition:', error);
      alert('Could not save the music. Please try generating it again.');
    }
  }

  playComposition(index) {
    try {
      this.stopMusic();
      const savedComposition = this.savedCompositions[index];

      if (!savedComposition || !savedComposition.tracks) {
        throw new Error('Invalid composition data');
      }

      // Create a fresh copy with all necessary properties
      this.currentComposition = {
        ...savedComposition,
        tracks: savedComposition.tracks.map(track => ({
          instrument: track.instrument,
          notes: Array.isArray(track.notes) ? [...track.notes] : [],
          rhythm: Array.isArray(track.rhythm) ? [...track.rhythm] : []
        }))
      };

      this.playMusic();
    } catch (error) {
      console.error('Error playing composition:', error);
      alert('Unable to play this composition. It may be corrupted.');
    }
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

  setupVisualization() {
    this.barGraphCanvas = document.getElementById('barGraphCanvas');
    this.barGraphCtx = this.barGraphCanvas.getContext('2d');
    this.fft = new Tone.Analyser('fft', 32);

    // Connect all instruments to analyzer
    Object.values(this.instruments).forEach(instrument => {
      instrument.connect(this.fft);
    });

    // Set canvas size
    this.resizeBarGraphCanvas();
    window.addEventListener('resize', () => {
      this.resizeBarGraphCanvas();
    });
  }

  resizeBarGraphCanvas() {
    this.barGraphCanvas.width = this.barGraphCanvas.offsetWidth;
    this.barGraphCanvas.height = this.barGraphCanvas.offsetHeight;
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
      const barHeight = (value + 140) * 2;
      const x = i * barWidth;
      const y = height - barHeight;

      this.barGraphCtx.fillStyle = 'var(--primary-color)';
      this.barGraphCtx.fillRect(x, y, barWidth, barHeight);
    });
  }

  setupHistoryElements() {
    this.historyContainer = document.getElementById('historyContainer');
    if (!this.historyContainer) {
      console.error('History container not found');
      return;
    }
    this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
  }

  addToHistory(item) {
    if (!this.history) {
      this.history = [];
    }

    console.log('Adding to history:', item); // Debug log

    this.history.unshift(item);
    if (this.history.length > 20) {
      this.history.pop();
    }

    this.saveHistory();
    this.updateHistoryDisplay();
  }

  updateHistoryDisplay() {
    if (!this.historyContainer) {
      console.error('History container not available');
      return;
    }

    console.log('Updating history display, items:', this.history.length); // Debug log

    this.historyContainer.innerHTML = '';

    this.history.forEach((item, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.style.cursor = 'pointer';

      historyItem.innerHTML = `
        <img src="${item.imageData}" alt="Uploaded image">
        <div class="history-item-info">
          <div class="history-item-title">${item.filename}</div>
          <div class="history-item-date">${item.date}</div>
        </div>
      `;

      historyItem.addEventListener('click', () => {
        this.loadHistoryItem(item);
      });

      this.historyContainer.appendChild(historyItem);
    });
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem('musicGeneratorHistory');
      if (saved) {
        this.history = JSON.parse(saved);
        console.log('Loaded history items:', this.history.length); // Debug log
        this.updateHistoryDisplay();
      }
    } catch (error) {
      console.error('Error loading history:', error);
      this.history = [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem('musicGeneratorHistory', JSON.stringify(this.history));
      console.log('History saved, items:', this.history.length); // Debug log
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }

  clearHistory() {
    if (confirm('Are you sure you want to clear the history?')) {
      this.history = [];
      this.saveHistory();
      this.updateHistoryDisplay();
    }
  }

  loadHistoryItem(item) {
    const img = new Image();
    img.onload = () => {
      this.canvas.width = img.width;
      this.canvas.height = img.height;
      this.ctx.drawImage(img, 0, 0);
      this.generateButton.disabled = false;
      this.updateBackground(item.imageData);

      // If the history item has composition data, load it
      if (item.composition) {
        this.currentComposition = item.composition;
        this.playButton.disabled = false;
        this.stopButton.disabled = false;
        this.saveButton.disabled = false;
      }
    };
    img.src = item.imageData;
  }

  setupTimeline() {
    this.currentTime = 0;
    this.duration = 0;

    this.timeline.addEventListener('click', (e) => {
      const rect = this.timeline.getBoundingClientRect();
      const position = (e.clientX - rect.left) / rect.width;
      this.seekTo(position);
    });

    this.timeline.addEventListener('mousemove', (e) => {
      if (e.buttons === 1) { // Left mouse button is pressed
        const rect = this.timeline.getBoundingClientRect();
        const position = (e.clientX - rect.left) / rect.width;
        this.seekTo(position);
      }
    });
  }

  seekTo(position) {
    if (!this.currentComposition) return;

    position = Math.max(0, Math.min(1, position));
    this.currentTime = position * this.duration;

    if (this.isPlaying) {
      Tone.Transport.seconds = this.currentTime;
    }

    this.updateTimelinePosition();
  }

  updateTimelinePosition() {
    const position = this.currentTime / this.duration;
    this.timelineProgress.style.width = `${position * 100}%`;
    this.timelineCursor.style.left = `${position * 100}%`;
    this.timelineTime.textContent = `${this.formatTime(this.currentTime)} / ${this.formatTime(this.duration)}`;
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  updateDescriptions(analysis) {
    // Calculate overall brightness and color characteristics
    const avgBrightness = analysis.sections.reduce((sum, section) =>
      sum + (section.averageColor[0] + section.averageColor[1] + section.averageColor[2]) / 3, 0
    ) / analysis.sections.length;

    const colorfulness = analysis.dominantColors.length;

    // Generate image description
    let imageDesc = "I see an image that's ";
    if (avgBrightness > 200) imageDesc += "very bright and vibrant";
    else if (avgBrightness > 150) imageDesc += "well-lit and clear";
    else if (avgBrightness > 100) imageDesc += "moderately lit";
    else imageDesc += "dark and moody";

    imageDesc += ` with ${colorfulness} dominant colors. `;
    if (colorfulness > 3) {
      imageDesc += "The variety of colors suggests a dynamic and lively scene.";
    } else {
      imageDesc += "The limited color palette creates a focused and harmonious atmosphere.";
    }

    // Generate music description
    let musicDesc = "I've created a ";
    if (avgBrightness > 150) {
      musicDesc += "bright and uplifting melody";
    } else {
      musicDesc += "gentle and contemplative piece";
    }
    musicDesc += ` at ${this.calculateTempo(analysis)} BPM, `;
    musicDesc += "featuring piano, atmospheric pads, and gentle bells.";

    // Update the UI
    this.imageDescription.textContent = imageDesc;
    this.musicDescription.textContent = musicDesc;
  }

  clearDescriptions() {
    this.imageDescription.textContent = '';
    this.musicDescription.textContent = '';
  }
}

// Initialize the application
let musicGenerator;
document.addEventListener('DOMContentLoaded', () => {
  musicGenerator = new EnhancedMusicGenerator();
});