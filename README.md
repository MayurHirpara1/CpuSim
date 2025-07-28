# 🖥️ CPU Scheduler Visualizer

A comprehensive web-based visualization tool for CPU scheduling algorithms. This interactive application helps students and professionals understand different CPU scheduling algorithms through dynamic Gantt charts, performance metrics, and real-time comparisons.

![CPU Scheduler Visualizer](https://img.shields.io/badge/CPU-Scheduler-blue.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![HTML5](https://img.shields.io/badge/HTML5-Latest-red.svg)
![CSS3](https://img.shields.io/badge/CSS3-Latest-blue.svg)

## 🚀 Features

### 🎯 Supported Algorithms
- **FCFS (First Come First Serve)** - Non-preemptive scheduling based on arrival time
- **SJF (Shortest Job First)** - Non-preemptive scheduling based on burst time
- **SRTF (Shortest Remaining Time First)** - Preemptive version of SJF
- **Priority Scheduling** - Both preemptive and non-preemptive modes
- **Round Robin** - Time-quantum based preemptive scheduling

### 📊 Interactive Features
- **Real-time Gantt Chart Generation** - Visual representation of process execution
- **Performance Metrics Dashboard** - Detailed analysis including:
  - Completion Time
  - Turnaround Time
  - Waiting Time
  - Response Time
  - Average metrics calculation
- **Process Management** - Add, edit, and remove processes dynamically
- **Bulk Testing** - Test with up to 5,000 processes for performance analysis
- **CSV Export** - Export performance metrics for further analysis
- **Dark/Light Mode** - Toggle between themes for better user experience

### 🛠️ Advanced Configuration
- **Custom Process Generation** - Configurable ranges for arrival time, burst time, and priority
- **Algorithm Comparison** - Single algorithm testing with detailed metrics
- **Time Quantum Control** - Adjustable time quantum for Round Robin scheduling
- **Responsive Design** - Works seamlessly on desktop and mobile devices


## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MayurHirpara1/cpu-scheduling.git
   cd cpu-scheduling
   ```

2. **Open in browser**
   ```bash
   # Option 1: Direct file opening
   open index.html
   
   # Option 2: Using a local server (recommended)
   python -m http.server 8000
   # Then open http://localhost:8000
   ```

3. **Start scheduling!**
   - Add processes manually or use the bulk testing feature
   - Select an algorithm
   - View the interactive Gantt chart and performance metrics

## 💻 Usage

### Adding Processes
1. Use the process input form to add individual processes
2. Specify Process ID, Arrival Time, Burst Time, and Priority
3. Click "Add Process" to include in the scheduling queue

### Running Algorithms
1. Select a scheduling algorithm from the available options
2. For Round Robin, set the desired time quantum
3. Click "Calculate" to generate the Gantt chart and metrics

### Bulk Testing
1. Click "Configure Test" button
2. Choose process count (1000, 5000, or custom)
3. Set parameter ranges for random process generation
4. Select algorithm and configure time quantum if needed
5. Run comprehensive performance analysis

### Exporting Results
- Click "Export CSV" to download performance metrics
- Data includes all process details and calculated times

## 🏗️ Technical Architecture

### Project Structure
```
cpu-scheduling/
├── index.html          # Main HTML structure
├── script.js           # Core JavaScript logic
├── styles.css          # Custom styling
└── README.md           # Documentation
```

### Key Components

#### CPUScheduler Class
The main class handling all scheduling algorithms and UI interactions:

```javascript
class CPUScheduler {
    constructor() {
        this.processes = [];
        this.ganttData = [];
        this.metrics = [];
        this.processColors = [...];
        // ... initialization
    }
    
    // Algorithm implementations
    calculateFCFS() { /* ... */ }
    calculateSJF() { /* ... */ }
    calculateSRTF() { /* ... */ }
    // ... other algorithms
}
```

#### Algorithm Implementations
- **Theoretical Accuracy**: All algorithms follow standard CPU scheduling theory
- **Performance Optimized**: Efficient implementations for large-scale testing
- **Visual Integration**: Seamless Gantt chart generation

#### UI Components
- **Responsive Layout**: Built with Tailwind CSS
- **Interactive Charts**: SVG-based Gantt chart rendering
- **Modal Dialogs**: Advanced configuration options
- **Real-time Updates**: Dynamic metric calculations

## 🧪 Testing

### Console Commands
The application exposes global functions for testing:

```javascript
// Test with specific number of processes
testWithNProcesses(1000);

// Custom configuration testing
testWithCustomConfig({
    processCount: 500,
    arrivalMin: 0,
    arrivalMax: 50,
    burstMin: 1,
    burstMax: 15,
    priorityMin: 1,
    priorityMax: 5,
    algorithms: ['fcfs'],
    timeQuantum: 3
});
```

### Performance Benchmarks
- Handles up to 5,000 processes efficiently
- Real-time algorithm execution measurement
- Memory-optimized for large datasets

## 🎨 Customization

### Adding New Algorithms
1. Implement the algorithm method in the `CPUScheduler` class
2. Add algorithm option to the UI
3. Update the algorithm mapping in configuration

### Theming
The application supports dark/light mode switching and can be easily customized through CSS variables.

### Areas for Contribution
- Additional scheduling algorithms (MLQ, MLFQ, etc.)
- Enhanced visualizations
- Performance optimizations
- Mobile responsiveness improvements
- Accessibility enhancements

## 📚 Educational Value

This tool is perfect for:
- **Computer Science Students** - Understanding CPU scheduling concepts
- **Operating Systems Courses** - Practical visualization of theoretical concepts
- **Algorithm Analysis** - Comparing performance metrics across algorithms
- **Self-Learning** - Interactive exploration of scheduling behavior

### Learning Outcomes
- Understand different CPU scheduling strategies
- Analyze algorithm performance characteristics
- Compare waiting times, turnaround times, and response times
- Visualize process execution patterns

⭐ **Star this repository if it helped you understand CPU scheduling algorithms!**
