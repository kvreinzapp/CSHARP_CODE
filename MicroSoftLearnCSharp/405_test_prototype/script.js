class MusicGenerator {
  constructor() {
    this.setupAudioContext();
    this.setupElements();
    this.setupEventListeners();
    this.isPlaying = false;
  }

  setupAudioContext() {
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
  }

  setupElements() {
    this.imageInput = document.getElementById('imageInput');
    this.generateButton = document.getElementById('generateButton');
    this.playButton = document.getElementById('playButton');
    this.stopButton = document.getElementById('stopButton');
    this.canvas = document.getElementById('imageCanvas');
    this.ctx = this.canvas.getContext('2d');
  }

  setupEventListeners() {
    this.imageInput.addEventListener('change', () => this.handleImageUpload());
    this.generateButton.addEventListener('click', () => this.generateMusic());
    this.playButton.addEventListener('click', () => this.togglePlay());
    this.stopButton.addEventListener('click', () => this.stopMusic());
  }

  handleImageUpload() {
    const file = this.imageInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.ctx.drawImage(img, 0, 0);
          this.generateButton.disabled = false;
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  analyzeImage() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    let totalBrightness = 0;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;
    }

    const avgBrightness = totalBrightness / (data.length / 4);
    return { brightness: avgBrightness };
  }

  generateMusic() {
    const analysis = this.analyzeImage();

    // Simple melody based on image brightness
    const notes = ['C4', 'D4', 'E4', 'G4', 'A4'];
    this.melody = [];

    for (let i = 0; i < 8; i++) {
      const noteIndex = Math.floor((analysis.brightness / 255) * notes.length);
      this.melody.push(notes[noteIndex]);
    }

    this.playButton.disabled = false;
    this.stopButton.disabled = false;
  }

  async togglePlay() {
    if (!this.isPlaying) {
      await Tone.start();
      this.playMusic();
    } else {
      this.stopMusic();
    }
  }

  playMusic() {
    if (!this.melody) return;

    this.isPlaying = true;
    this.playButton.textContent = 'Pause';

    const repeat = (time) => {
      this.melody.forEach((note, i) => {
        this.synth.triggerAttackRelease(note, '8n', time + i * 0.5);
      });
    };

    Tone.Transport.bpm.value = 120;
    this.pattern = new Tone.Pattern(repeat, this.melody);
    this.pattern.start(0);
    Tone.Transport.start();
  }

  stopMusic() {
    this.isPlaying = false;
    this.playButton.textContent = 'Play';

    if (this.pattern) {
      this.pattern.stop();
      this.pattern.dispose();
    }
    Tone.Transport.stop();
  }
}

// Initialize the application
let musicGenerator;
document.addEventListener('DOMContentLoaded', () => {
  musicGenerator = new MusicGenerator();
});