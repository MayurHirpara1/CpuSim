// CPU Scheduler Visualizer - Main JavaScript File

class CPUScheduler {
    constructor() {
        this.processes = [];
        this.currentAlgorithm = null;
        this.ganttChart = null;
        this.ganttData = [];
        this.metrics = [];
        this.processColors = [
            '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
            '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
        ];
        
        // Default process data - designed to test various scheduling scenarios
        // Based on common CPU scheduling examples from operating systems textbooks
        this.defaultProcesses = [
            { id: 'P1', arrivalTime: 0, burstTime: 80, priority: 1 },
            { id: 'P2', arrivalTime: 20, burstTime: 60, priority: 2 },
            { id: 'P3', arrivalTime: 40, burstTime: 65, priority: 3 },
            { id: 'P4', arrivalTime: 60, burstTime: 120, priority: 4 },
            { id: 'P5', arrivalTime: 80, burstTime: 30, priority: 5 },
            { id: 'P6', arrivalTime: 90, burstTime: 90, priority: 6 },
            { id: 'P7', arrivalTime: 120, burstTime: 25, priority: 7 },
            { id: 'P8', arrivalTime: 240, burstTime: 40, priority: 8 },
            { id: 'P9', arrivalTime: 260, burstTime: 90, priority: 9 },
            { id: 'P10', arrivalTime: 380, burstTime: 75, priority: 10 }
        ];
        
        this.initializeEventListeners();
        this.setupTheme();
        this.loadDefaultProcesses();
        this.setupResponsiveChart();
    }

    setupResponsiveChart() {
        // Handle window resize for responsive chart
        window.addEventListener('resize', () => {
            if (this.ganttData.length > 0) {
                this.debounce(() => this.updateGanttChart(), 300);
            }
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    initializeEventListeners() {
        // Process input handlers
        document.getElementById('addProcess').addEventListener('click', () => this.addProcess());
        document.getElementById('resetAll').addEventListener('click', () => this.resetAll());
        
        // Algorithm buttons
        document.querySelectorAll('.calculate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const algorithm = e.target.dataset.algorithm;
                this.calculateSchedule(algorithm);
            });
        });

        // Algorithm card selection
        document.querySelectorAll('.algorithm-card').forEach(card => {
            card.addEventListener('click', () => {
                const algorithm = card.dataset.algorithm;
                this.selectAlgorithm(algorithm);
            });
        });

        // Export buttons
        document.getElementById('exportChart').addEventListener('click', () => this.exportChart());
        document.getElementById('exportCSV').addEventListener('click', () => this.exportCSV());
        
        // Time quantum setting
        document.getElementById('setTimeQuantum').addEventListener('click', () => this.setTimeQuantum());
        
        // Enter key for time quantum
        document.getElementById('timeQuantum').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setTimeQuantum();
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Enter key handling for inputs
        ['processId', 'arrivalTime', 'burstTime', 'priority'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addProcess();
            });
        });

        // Time quantum input
        document.getElementById('timeQuantum').addEventListener('input', () => {
            if (this.currentAlgorithm === 'round-robin') {
                this.updateCalculateButtons();
            }
        });
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }
    }

    toggleTheme() {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Redraw chart if it exists
        if (this.ganttChart) {
            this.updateGanttChart();
        }
    }

    addProcess() {
        const processId = document.getElementById('processId').value.trim();
        const arrivalTime = parseInt(document.getElementById('arrivalTime').value) || 0;
        const burstTime = parseInt(document.getElementById('burstTime').value);
        const priority = parseInt(document.getElementById('priority').value) || 1;

        // Validation
        if (!processId) {
            this.showError('Process ID is required');
            return;
        }

        if (!burstTime || burstTime <= 0) {
            this.showError('Burst time must be a positive number');
            return;
        }

        if (this.processes.some(p => p.id === processId)) {
            this.showError('Process ID already exists');
            return;
        }

        if (arrivalTime < 0) {
            this.showError('Arrival time cannot be negative');
            return;
        }

        const process = {
            id: processId,
            arrivalTime,
            burstTime,
            priority,
            color: this.processColors[this.processes.length % this.processColors.length],
            originalBurstTime: burstTime
        };

        this.processes.push(process);
        this.updateProcessList();
        this.clearInputs();
        this.updateCalculateButtons();
        this.hideResults();
    }

    removeProcess(processId) {
        this.processes = this.processes.filter(p => p.id !== processId);
        this.updateProcessList();
        this.updateCalculateButtons();
        
        if (this.processes.length === 0) {
            this.hideResults();
        }
    }

    loadDefaultProcesses() {
        // Clear existing processes first
        this.processes = [];
        
        // Add default processes
        this.defaultProcesses.forEach((processData, index) => {
            const process = {
                id: processData.id,
                arrivalTime: processData.arrivalTime,
                burstTime: processData.burstTime,
                priority: processData.priority,
                color: this.processColors[index % this.processColors.length],
                originalBurstTime: processData.burstTime
            };
            this.processes.push(process);
        });
        
        this.updateProcessList();
        this.updateCalculateButtons();
    }

    setTimeQuantum() {
        const quantumInput = document.getElementById('timeQuantum');
        const quantumValue = parseInt(quantumInput.value);
        
        if (!quantumValue || quantumValue <= 0) {
            this.showError('Please enter a valid time quantum (positive number)');
            quantumInput.focus();
            return;
        }
        
        // Store the quantum value
        this.timeQuantum = quantumValue;
        
        // Show confirmation
        const quantumStatus = document.getElementById('quantumStatus');
        const currentQuantum = document.getElementById('currentQuantum');
        currentQuantum.textContent = quantumValue;
        quantumStatus.classList.remove('hidden');
        
        // Update calculate button if Round Robin is selected
        if (this.currentAlgorithm === 'round-robin') {
            this.updateCalculateButtons();
        }
        
        // Optional: Show success message briefly
        setTimeout(() => {
            quantumStatus.classList.add('hidden');
        }, 3000);
    }

    resetAll() {
        this.currentAlgorithm = null;
        this.ganttData = [];
        this.metrics = [];
        this.timeQuantum = null; // Clear time quantum
        
        // Load default processes instead of clearing all
        this.loadDefaultProcesses();
        this.hideResults();
        this.clearAlgorithmSelection();
        this.clearInputs();
        this.clearTimeQuantum();
    }

    clearTimeQuantum() {
        document.getElementById('timeQuantum').value = '';
        document.getElementById('quantumStatus').classList.add('hidden');
        document.getElementById('roundRobinSettings').classList.add('hidden');
    }

    clearInputs() {
        document.getElementById('processId').value = '';
        document.getElementById('arrivalTime').value = '';
        document.getElementById('burstTime').value = '';
        document.getElementById('priority').value = '';
        
        // Auto-generate next process ID
        const nextId = 'P' + (this.processes.length + 1);
        document.getElementById('processId').value = nextId;
    }

    updateProcessList() {
        const processList = document.getElementById('processList');
        
        if (this.processes.length === 0) {
            processList.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    <i class="fas fa-inbox text-2xl mb-2 opacity-50"></i>
                    <p class="text-sm">No processes added yet</p>
                </div>
            `;
            return;
        }

        // Create table structure similar to performance metrics
        processList.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Process</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">AT</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">BT</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        ${this.processes.map((process, index) => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                <td class="px-4 py-3 whitespace-nowrap">
                                    <div class="flex items-center space-x-2">
                                        <div class="w-3 h-3 rounded-full" style="background-color: ${process.color}"></div>
                                        <span class="text-sm font-medium text-gray-900 dark:text-white">${process.id}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">${process.arrivalTime}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">${process.burstTime}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">${process.priority}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-center">
                                    <button onclick="scheduler.removeProcess('${process.id}')" 
                                            class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded transition-colors duration-150"
                                            title="Remove process">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="mt-3 text-xs text-gray-500 dark:text-gray-400">
                <div class="grid grid-cols-2 gap-4">
                    <div><strong class="text-gray-700 dark:text-gray-300">AT:</strong> Arrival Time</div>
                    <div><strong class="text-gray-700 dark:text-gray-300">BT:</strong> Burst Time</div>
                </div>
            </div>
        `;
    }

    selectAlgorithm(algorithm) {
        // Clear previous selection
        document.querySelectorAll('.algorithm-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Select new algorithm
        const selectedCard = document.querySelector(`[data-algorithm="${algorithm}"]`);
        selectedCard.classList.add('selected');

        this.currentAlgorithm = algorithm;

        // Show/hide Round Robin settings
        const rrSettings = document.getElementById('roundRobinSettings');
        if (algorithm === 'round-robin') {
            rrSettings.classList.remove('hidden');
        } else {
            rrSettings.classList.add('hidden');
        }

        this.updateAlgorithmIndicator(algorithm);
    }

    updateAlgorithmIndicator(algorithm) {
        const indicator = document.getElementById('algorithmIndicator');
        const dot = document.getElementById('selectedAlgorithmDot');
        const name = document.getElementById('selectedAlgorithmName');

        const algorithmInfo = {
            'fcfs': { name: 'FCFS', color: '#3B82F6' },
            'sjf': { name: 'SJF', color: '#10B981' },
            'srtf': { name: 'SRTF', color: '#8B5CF6' },
            'priority': { name: 'Priority', color: '#F59E0B' },
            'priority-preemptive': { name: 'Priority (P)', color: '#EF4444' },
            'round-robin': { name: 'Round Robin', color: '#EC4899' }
        };

        const info = algorithmInfo[algorithm];
        if (info) {
            dot.style.backgroundColor = info.color;
            name.textContent = info.name;
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    updateCalculateButtons() {
        const hasProcesses = this.processes.length > 0;
        document.querySelectorAll('.calculate-btn').forEach(btn => {
            const algorithm = btn.dataset.algorithm;
            
            // For Round Robin, also check if time quantum is set
            if (algorithm === 'round-robin') {
                const hasQuantum = this.timeQuantum && this.timeQuantum > 0;
                btn.disabled = !hasProcesses || !hasQuantum;
                
                // Update button text to indicate quantum requirement
                if (hasProcesses && !hasQuantum) {
                    const icon = btn.querySelector('i');
                    const text = btn.querySelector('.btn-text') || document.createElement('span');
                    text.className = 'btn-text';
                    text.textContent = 'Set Quantum First';
                    btn.innerHTML = '';
                    btn.appendChild(icon);
                    btn.appendChild(text);
                } else {
                    btn.innerHTML = '<i class="fas fa-calculator mr-2"></i>Calculate';
                }
            } else {
                btn.disabled = !hasProcesses;
            }
        });

        // Update export buttons
        const hasResults = this.ganttData.length > 0;
        document.getElementById('exportChart').disabled = !hasResults;
        document.getElementById('exportCSV').disabled = !hasResults;
    }

    calculateSchedule(algorithm) {
        if (this.processes.length === 0) {
            this.showError('Please add at least one process');
            return;
        }

        this.selectAlgorithm(algorithm);
        
        let result;
        switch (algorithm) {
            case 'fcfs':
                result = this.calculateFCFS();
                break;
            case 'sjf':
                result = this.calculateSJF();
                break;
            case 'srtf':
                result = this.calculateSRTF();
                break;
            case 'priority':
                result = this.calculatePriority(false);
                break;
            case 'priority-preemptive':
                result = this.calculatePriority(true);
                break;
            case 'round-robin':
                result = this.calculateRoundRobin();
                break;
            default:
                this.showError('Unknown algorithm');
                return;
        }

        this.ganttData = result.ganttData;
        this.metrics = result.metrics;
        
        this.updateGanttChart();
        this.updateMetricsTable();
        this.updateCalculateButtons();
    }

    calculateFCFS() {
        // FCFS Theory: Execute processes in order of arrival (non-preemptive)
        // Reference: GeeksforGeeks FCFS implementation
        
        const processes = [...this.processes].sort((a, b) => {
            // Primary sort: arrival time
            if (a.arrivalTime !== b.arrivalTime) {
                return a.arrivalTime - b.arrivalTime;
            }
            // Secondary sort: process ID for consistency
            return a.id.localeCompare(b.id);
        });

        const ganttData = [];
        const metrics = [];
        let currentTime = 0;

        for (let i = 0; i < processes.length; i++) {
            const process = processes[i];
            
            // If CPU is idle (next process hasn't arrived yet)
            if (currentTime < process.arrivalTime) {
                // Add idle time to Gantt chart
                ganttData.push({
                    processId: null,
                    startTime: currentTime,
                    endTime: process.arrivalTime,
                    color: '#e5e7eb'
                });
                currentTime = process.arrivalTime;
            }

            const startTime = currentTime;
            const completionTime = startTime + process.burstTime;

            // Add process execution to Gantt chart
            ganttData.push({
                processId: process.id,
                startTime: startTime,
                endTime: completionTime,
                color: process.color
            });

            // Calculate metrics according to theory:
            // Turnaround Time = Completion Time - Arrival Time
            // Waiting Time = Turnaround Time - Burst Time
            // Response Time = Start Time - Arrival Time (first execution time)
            const turnaroundTime = completionTime - process.arrivalTime;
            const waitingTime = turnaroundTime - process.burstTime;
            const responseTime = startTime - process.arrivalTime;

            metrics.push({
                processId: process.id,
                arrivalTime: process.arrivalTime,
                burstTime: process.burstTime,
                completionTime: completionTime,
                turnaroundTime: turnaroundTime,
                waitingTime: waitingTime,
                responseTime: responseTime,
                color: process.color
            });

            currentTime = completionTime;
        }

        return { ganttData, metrics };
    }

    calculateSJF() {
        // SJF Theory: Select process with shortest burst time among available processes (non-preemptive)
        // Reference: GeeksforGeeks SJF implementation
        
        const processes = [...this.processes];
        const ganttData = [];
        const metrics = [];
        const completed = new Set();
        let currentTime = 0;

        while (completed.size < processes.length) {
            // Find all processes that have arrived and not completed
            const availableProcesses = processes.filter(p => 
                p.arrivalTime <= currentTime && !completed.has(p.id)
            );

            // If no process is available, advance time to next arrival
            if (availableProcesses.length === 0) {
                const nextArrival = Math.min(...processes
                    .filter(p => !completed.has(p.id))
                    .map(p => p.arrivalTime)
                );
                
                // Add idle time to Gantt chart
                ganttData.push({
                    processId: null,
                    startTime: currentTime,
                    endTime: nextArrival,
                    color: '#e5e7eb'
                });
                currentTime = nextArrival;
                continue;
            }

            // Select process with shortest burst time (SJF principle)
            let selectedProcess = availableProcesses[0];
            for (let i = 1; i < availableProcesses.length; i++) {
                if (availableProcesses[i].burstTime < selectedProcess.burstTime ||
                    (availableProcesses[i].burstTime === selectedProcess.burstTime && 
                     availableProcesses[i].arrivalTime < selectedProcess.arrivalTime)) {
                    selectedProcess = availableProcesses[i];
                }
            }

            const startTime = currentTime;
            const completionTime = startTime + selectedProcess.burstTime;

            // Add process execution to Gantt chart
            ganttData.push({
                processId: selectedProcess.id,
                startTime: startTime,
                endTime: completionTime,
                color: selectedProcess.color
            });

            // Calculate metrics according to theory
            const turnaroundTime = completionTime - selectedProcess.arrivalTime;
            const waitingTime = turnaroundTime - selectedProcess.burstTime;
            const responseTime = startTime - selectedProcess.arrivalTime;

            metrics.push({
                processId: selectedProcess.id,
                arrivalTime: selectedProcess.arrivalTime,
                burstTime: selectedProcess.burstTime,
                completionTime: completionTime,
                turnaroundTime: turnaroundTime,
                waitingTime: waitingTime,
                responseTime: responseTime,
                color: selectedProcess.color
            });

            completed.add(selectedProcess.id);
            currentTime = completionTime;
        }

        return { ganttData, metrics };
    }

    calculateSRTF() {
        // SRTF Theory: Preemptive SJF - switch to process with shortest remaining time
        // Reference: GeeksforGeeks SRTF implementation
        
        const processes = this.processes.map(p => ({
            ...p,
            remainingTime: p.burstTime,
            firstExecutionTime: -1
        }));
        
        const ganttData = [];
        const metrics = [];
        const completed = new Set();
        let currentTime = 0;
        let lastExecutedProcess = null;

        while (completed.size < processes.length) {
            // Find all processes that have arrived and not completed
            const availableProcesses = processes.filter(p => 
                p.arrivalTime <= currentTime && !completed.has(p.id) && p.remainingTime > 0
            );

            // If no process is available, advance time to next arrival
            if (availableProcesses.length === 0) {
                const nextArrival = Math.min(...processes
                    .filter(p => !completed.has(p.id))
                    .map(p => p.arrivalTime)
                );
                
                // Add idle time to Gantt chart
                ganttData.push({
                    processId: null,
                    startTime: currentTime,
                    endTime: nextArrival,
                    color: '#e5e7eb'
                });
                currentTime = nextArrival;
                continue;
            }

            // Select process with shortest remaining time (SRTF principle)
            let selectedProcess = availableProcesses[0];
            for (let i = 1; i < availableProcesses.length; i++) {
                if (availableProcesses[i].remainingTime < selectedProcess.remainingTime ||
                    (availableProcesses[i].remainingTime === selectedProcess.remainingTime && 
                     availableProcesses[i].arrivalTime < selectedProcess.arrivalTime)) {
                    selectedProcess = availableProcesses[i];
                }
            }

            // Record first execution time for response time calculation
            if (selectedProcess.firstExecutionTime === -1) {
                selectedProcess.firstExecutionTime = currentTime;
            }

            // Execute for 1 time unit
            const startTime = currentTime;
            currentTime++;
            selectedProcess.remainingTime--;

            // Add to Gantt chart (merge consecutive segments of same process)
            if (ganttData.length > 0 && 
                ganttData[ganttData.length - 1].processId === selectedProcess.id) {
                ganttData[ganttData.length - 1].endTime = currentTime;
            } else {
                ganttData.push({
                    processId: selectedProcess.id,
                    startTime: startTime,
                    endTime: currentTime,
                    color: selectedProcess.color
                });
            }

            // If process is completed
            if (selectedProcess.remainingTime === 0) {
                const completionTime = currentTime;
                const turnaroundTime = completionTime - selectedProcess.arrivalTime;
                const waitingTime = turnaroundTime - selectedProcess.burstTime;
                const responseTime = selectedProcess.firstExecutionTime - selectedProcess.arrivalTime;

                metrics.push({
                    processId: selectedProcess.id,
                    arrivalTime: selectedProcess.arrivalTime,
                    burstTime: selectedProcess.burstTime,
                    completionTime: completionTime,
                    turnaroundTime: turnaroundTime,
                    waitingTime: waitingTime,
                    responseTime: responseTime,
                    color: selectedProcess.color
                });

                completed.add(selectedProcess.id);
            }
        }

        return { ganttData, metrics };
    }

    calculatePriority(preemptive = false) {
        // Priority Theory: Select process with highest priority (highest number)
        // Reference: GeeksforGeeks Priority scheduling implementation
        // Modified: Higher number = Higher priority (instead of lower number = higher priority)
        
        if (!preemptive) {
            // Non-preemptive Priority Scheduling
            const processes = [...this.processes];
            const ganttData = [];
            const metrics = [];
            const completed = new Set();
            let currentTime = 0;

            while (completed.size < processes.length) {
                // Find all processes that have arrived and not completed
                const availableProcesses = processes.filter(p => 
                    p.arrivalTime <= currentTime && !completed.has(p.id)
                );

                // If no process is available, advance time to next arrival
                if (availableProcesses.length === 0) {
                    const nextArrival = Math.min(...processes
                        .filter(p => !completed.has(p.id))
                        .map(p => p.arrivalTime)
                    );
                    
                    // Add idle time to Gantt chart
                    ganttData.push({
                        processId: null,
                        startTime: currentTime,
                        endTime: nextArrival,
                        color: '#e5e7eb'
                    });
                    currentTime = nextArrival;
                    continue;
                }

                // Select process with highest priority (highest number)
                let selectedProcess = availableProcesses[0];
                for (let i = 1; i < availableProcesses.length; i++) {
                    if (availableProcesses[i].priority > selectedProcess.priority ||
                        (availableProcesses[i].priority === selectedProcess.priority && 
                         availableProcesses[i].arrivalTime < selectedProcess.arrivalTime)) {
                        selectedProcess = availableProcesses[i];
                    }
                }

                const startTime = currentTime;
                const completionTime = startTime + selectedProcess.burstTime;

                // Add process execution to Gantt chart
                ganttData.push({
                    processId: selectedProcess.id,
                    startTime: startTime,
                    endTime: completionTime,
                    color: selectedProcess.color
                });

                // Calculate metrics according to theory
                const turnaroundTime = completionTime - selectedProcess.arrivalTime;
                const waitingTime = turnaroundTime - selectedProcess.burstTime;
                const responseTime = startTime - selectedProcess.arrivalTime;

                metrics.push({
                    processId: selectedProcess.id,
                    arrivalTime: selectedProcess.arrivalTime,
                    burstTime: selectedProcess.burstTime,
                    completionTime: completionTime,
                    turnaroundTime: turnaroundTime,
                    waitingTime: waitingTime,
                    responseTime: responseTime,
                    color: selectedProcess.color
                });

                completed.add(selectedProcess.id);
                currentTime = completionTime;
            }

            return { ganttData, metrics };
        } else {
            // Preemptive Priority Scheduling
            const processes = this.processes.map(p => ({
                ...p,
                remainingTime: p.burstTime,
                firstExecutionTime: -1
            }));
            
            const ganttData = [];
            const metrics = [];
            const completed = new Set();
            let currentTime = 0;

            while (completed.size < processes.length) {
                // Find all processes that have arrived and not completed
                const availableProcesses = processes.filter(p => 
                    p.arrivalTime <= currentTime && !completed.has(p.id) && p.remainingTime > 0
                );

                // If no process is available, advance time to next arrival
                if (availableProcesses.length === 0) {
                    const nextArrival = Math.min(...processes
                        .filter(p => !completed.has(p.id))
                        .map(p => p.arrivalTime)
                    );
                    
                    // Add idle time to Gantt chart
                    ganttData.push({
                        processId: null,
                        startTime: currentTime,
                        endTime: nextArrival,
                        color: '#e5e7eb'
                    });
                    currentTime = nextArrival;
                    continue;
                }

                // Select process with highest priority (highest number)
                let selectedProcess = availableProcesses[0];
                for (let i = 1; i < availableProcesses.length; i++) {
                    if (availableProcesses[i].priority > selectedProcess.priority ||
                        (availableProcesses[i].priority === selectedProcess.priority && 
                         availableProcesses[i].arrivalTime < selectedProcess.arrivalTime)) {
                        selectedProcess = availableProcesses[i];
                    }
                }

                // Record first execution time for response time calculation
                if (selectedProcess.firstExecutionTime === -1) {
                    selectedProcess.firstExecutionTime = currentTime;
                }

                // Execute for 1 time unit
                const startTime = currentTime;
                currentTime++;
                selectedProcess.remainingTime--;

                // Add to Gantt chart (merge consecutive segments of same process)
                if (ganttData.length > 0 && 
                    ganttData[ganttData.length - 1].processId === selectedProcess.id) {
                    ganttData[ganttData.length - 1].endTime = currentTime;
                } else {
                    ganttData.push({
                        processId: selectedProcess.id,
                        startTime: startTime,
                        endTime: currentTime,
                        color: selectedProcess.color
                    });
                }

                // If process is completed
                if (selectedProcess.remainingTime === 0) {
                    const completionTime = currentTime;
                    const turnaroundTime = completionTime - selectedProcess.arrivalTime;
                    const waitingTime = turnaroundTime - selectedProcess.burstTime;
                    const responseTime = selectedProcess.firstExecutionTime - selectedProcess.arrivalTime;

                    metrics.push({
                        processId: selectedProcess.id,
                        arrivalTime: selectedProcess.arrivalTime,
                        burstTime: selectedProcess.burstTime,
                        completionTime: completionTime,
                        turnaroundTime: turnaroundTime,
                        waitingTime: waitingTime,
                        responseTime: responseTime,
                        color: selectedProcess.color
                    });

                    completed.add(selectedProcess.id);
                }
            }

            return { ganttData, metrics };
        }
    }

    calculateRoundRobin() {
        // Round Robin Theory: Each process gets time quantum, then goes to end of queue
        // Reference: GeeksforGeeks Round Robin implementation
        
        const timeQuantum = this.timeQuantum;
        
        if (!timeQuantum || timeQuantum <= 0) {
            this.showError('Please set a valid time quantum first');
            return null;
        }
        
        const processes = this.processes.map(p => ({
            ...p,
            remainingTime: p.burstTime,
            firstExecutionTime: -1
        }));

        const ganttData = [];
        const metrics = [];
        const completed = new Set();
        const readyQueue = [];
        let currentTime = 0;

        // Sort processes by arrival time initially
        const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        let processIndex = 0;

        // Add initial processes that arrive at time 0
        while (processIndex < sortedProcesses.length && 
               sortedProcesses[processIndex].arrivalTime <= currentTime) {
            readyQueue.push(sortedProcesses[processIndex]);
            processIndex++;
        }

        while (readyQueue.length > 0 || processIndex < sortedProcesses.length) {
            // If ready queue is empty, advance time to next arrival
            if (readyQueue.length === 0) {
                const nextArrival = sortedProcesses[processIndex].arrivalTime;
                
                // Add idle time to Gantt chart
                ganttData.push({
                    processId: null,
                    startTime: currentTime,
                    endTime: nextArrival,
                    color: '#e5e7eb'
                });
                currentTime = nextArrival;
                
                // Add newly arrived processes
                while (processIndex < sortedProcesses.length && 
                       sortedProcesses[processIndex].arrivalTime <= currentTime) {
                    readyQueue.push(sortedProcesses[processIndex]);
                    processIndex++;
                }
                continue;
            }

            // Take first process from ready queue
            const currentProcess = readyQueue.shift();
            
            // Record first execution time for response time calculation
            if (currentProcess.firstExecutionTime === -1) {
                currentProcess.firstExecutionTime = currentTime;
            }

            // Calculate execution time (minimum of time quantum and remaining time)
            const executionTime = Math.min(timeQuantum, currentProcess.remainingTime);
            const startTime = currentTime;
            const endTime = startTime + executionTime;

            // Add process execution to Gantt chart
            ganttData.push({
                processId: currentProcess.id,
                startTime: startTime,
                endTime: endTime,
                color: currentProcess.color
            });

            // Update process remaining time and current time
            currentProcess.remainingTime -= executionTime;
            currentTime = endTime;

            // Add newly arrived processes to ready queue
            while (processIndex < sortedProcesses.length && 
                   sortedProcesses[processIndex].arrivalTime <= currentTime) {
                readyQueue.push(sortedProcesses[processIndex]);
                processIndex++;
            }

            // If process is completed
            if (currentProcess.remainingTime === 0) {
                const completionTime = currentTime;
                const turnaroundTime = completionTime - currentProcess.arrivalTime;
                const waitingTime = turnaroundTime - currentProcess.burstTime;
                const responseTime = currentProcess.firstExecutionTime - currentProcess.arrivalTime;

                metrics.push({
                    processId: currentProcess.id,
                    arrivalTime: currentProcess.arrivalTime,
                    burstTime: currentProcess.burstTime,
                    completionTime: completionTime,
                    turnaroundTime: turnaroundTime,
                    waitingTime: waitingTime,
                    responseTime: responseTime,
                    color: currentProcess.color
                });

                completed.add(currentProcess.id);
            } else {
                // Process is not completed, add back to ready queue
                readyQueue.push(currentProcess);
            }
        }

        return { ganttData, metrics };
    }

    updateGanttChart() {
        const container = document.getElementById('ganttChartContainer');
        
        if (this.ganttData.length === 0) {
            container.classList.remove('has-data');
            container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-chart-bar text-4xl mb-4 opacity-50"></i>
                    <p class="text-lg font-medium mb-2">Gantt Chart will appear here</p>
                    <p class="text-sm">Add processes and select an algorithm to visualize</p>
                </div>
            `;
            return;
        }

        container.classList.add('has-data');
        
        const maxTime = Math.max(...this.ganttData.map(d => d.endTime));
        const containerWidth = container.offsetWidth - 48; // Account for padding and margins
        
        // Calculate optimal time unit based on data range and container size
        let timeUnit;
        if (maxTime <= 10) {
            timeUnit = Math.max(40, containerWidth / 12); // More space for small ranges
        } else if (maxTime <= 30) {
            timeUnit = Math.max(25, containerWidth / (maxTime + 2));
        } else if (maxTime <= 100) {
            timeUnit = Math.max(15, containerWidth / (maxTime + 5));
        } else {
            timeUnit = Math.max(8, containerWidth / (maxTime + 10));
        }
        
        // Ensure minimum readability
        timeUnit = Math.min(timeUnit, 50);
        
        const chartWidth = Math.max(300, (maxTime + 1) * timeUnit);
        const barHeight = 60;
        const timelineHeight = 30;
        const totalHeight = barHeight + timelineHeight + 40;

        container.innerHTML = `
            <div class="w-full overflow-x-auto">
                <div class="flex justify-center" style="min-width: ${chartWidth < containerWidth ? 'auto' : chartWidth + 'px'};">
                    <svg width="${chartWidth}" height="${totalHeight}" class="bg-white dark:bg-gray-800" viewBox="0 0 ${chartWidth} ${totalHeight}" preserveAspectRatio="xMidYMid meet">
                        <!-- Patterns for idle time -->
                        <defs>
                            <pattern id="idlePattern" patternUnits="userSpaceOnUse" width="8" height="8">
                                <rect width="8" height="8" fill="#f3f4f6"/>
                                <path d="M0,8 L8,0" stroke="#d1d5db" stroke-width="1"/>
                            </pattern>
                        </defs>
                        
                        <!-- Process bars -->
                        ${this.ganttData.map(segment => {
                            const x = segment.startTime * timeUnit;
                            const width = (segment.endTime - segment.startTime) * timeUnit;
                            
                            if (segment.processId === null) {
                                // Idle time - show as striped pattern
                                return `
                                    <rect x="${x}" y="20" width="${width}" height="${barHeight}" 
                                          fill="url(#idlePattern)" stroke="#9ca3af" stroke-width="1" 
                                          class="gantt-bar transition-all duration-200" rx="4">
                                        <title>Idle: ${segment.startTime} - ${segment.endTime}</title>
                                    </rect>
                                    <text x="${x + width/2}" y="${20 + barHeight/2 + 5}" 
                                          text-anchor="middle" fill="#6b7280" font-weight="normal" 
                                          font-size="${Math.max(8, Math.min(12, timeUnit / 4))}">
                                        IDLE
                                    </text>
                                `;
                            } else {
                                // Regular process
                                return `
                                    <rect x="${x}" y="20" width="${width}" height="${barHeight}" 
                                          fill="${segment.color}" stroke="#fff" stroke-width="2" 
                                          class="gantt-bar transition-all duration-200 hover:opacity-80" rx="4">
                                        <title>${segment.processId}: ${segment.startTime} - ${segment.endTime}</title>
                                    </rect>
                                    <text x="${x + width/2}" y="${20 + barHeight/2 + 5}" 
                                          text-anchor="middle" fill="white" font-weight="bold" 
                                          font-size="${Math.max(10, Math.min(14, timeUnit / 3))}">
                                        ${segment.processId}
                                    </text>
                                `;
                            }
                        }).join('')}
                        
                        <!-- Timeline -->
                        <line x1="0" y1="${barHeight + 30}" x2="${chartWidth}" y2="${barHeight + 30}" 
                              stroke="#374151" stroke-width="2"/>
                        
                        <!-- Time markers -->
                        ${this.generateTimeMarkers(maxTime, timeUnit, barHeight)}
                    </svg>
                </div>
            </div>
        `;

        this.updateProcessLegend();
    }

    generateTimeMarkers(maxTime, timeUnit, barHeight) {
        let markerInterval = 1;
        
        // Determine optimal marker interval based on time unit and data range
        if (timeUnit < 15) {
            if (maxTime > 100) markerInterval = 20;
            else if (maxTime > 50) markerInterval = 10;
            else if (maxTime > 20) markerInterval = 5;
            else markerInterval = 2;
        } else if (timeUnit < 25) {
            if (maxTime > 50) markerInterval = 10;
            else if (maxTime > 20) markerInterval = 5;
            else markerInterval = 2;
        } else if (timeUnit < 35) {
            if (maxTime > 20) markerInterval = 5;
            else markerInterval = 2;
        } else {
            markerInterval = 1;
        }

        const markers = [];
        for (let i = 0; i <= maxTime; i += markerInterval) {
            const x = i * timeUnit;
            const isMainMarker = i % (markerInterval * 2) === 0 || markerInterval === 1;
            const tickHeight = isMainMarker ? 10 : 5;
            
            markers.push(`
                <line x1="${x}" y1="${barHeight + 30 - tickHeight/2}" x2="${x}" y2="${barHeight + 30 + tickHeight/2}" 
                      stroke="#374151" stroke-width="${isMainMarker ? 2 : 1}"/>
                <text x="${x}" y="${barHeight + 50}" text-anchor="middle" 
                      font-size="${Math.max(9, Math.min(12, timeUnit / 4))}" fill="#6b7280">${i}</text>
            `);
        }

        // Always add the final marker if it's not already included
        if (maxTime % markerInterval !== 0) {
            const x = maxTime * timeUnit;
            markers.push(`
                <line x1="${x}" y1="${barHeight + 25}" x2="${x}" y2="${barHeight + 35}" 
                      stroke="#374151" stroke-width="2"/>
                <text x="${x}" y="${barHeight + 50}" text-anchor="middle" 
                      font-size="${Math.max(9, Math.min(12, timeUnit / 4))}" fill="#6b7280">${maxTime}</text>
            `);
        }

        return markers.join('');
    }

    updateProcessLegend() {
        const legend = document.getElementById('processLegend');
        
        if (this.ganttData.length === 0) {
            legend.classList.add('hidden');
            return;
        }

        const uniqueProcesses = [...new Set(this.ganttData
            .filter(d => d.processId !== null) // Exclude idle time
            .map(d => d.processId))]
            .map(id => {
                const process = this.processes.find(p => p.id === id);
                return { id, color: process.color };
            });

        // Add idle indicator if there are any idle segments
        const hasIdleTime = this.ganttData.some(d => d.processId === null);
        
        legend.innerHTML = `
            <div class="flex flex-wrap items-center gap-4">
                ${uniqueProcesses.map(process => `
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 rounded-full" style="background-color: ${process.color}"></div>
                        <span class="text-sm text-gray-900 dark:text-white">${process.id}</span>
                    </div>
                `).join('')}
                ${hasIdleTime ? `
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 rounded-sm bg-gray-300 border border-gray-400" style="background-image: repeating-linear-gradient(45deg, #f3f4f6 0, #f3f4f6 2px, #d1d5db 2px, #d1d5db 4px);"></div>
                        <span class="text-sm text-gray-600 dark:text-gray-400">Idle</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        legend.classList.remove('hidden');
    }

    updateMetricsTable() {
        const container = document.getElementById('metricsContainer');
        const tbody = document.getElementById('metricsTableBody');
        
        if (this.metrics.length === 0) {
            container.classList.add('hidden');
            return;
        }

        // Calculate averages according to CPU scheduling theory
        // Average Waiting Time = Sum of all waiting times / Number of processes
        // Average Turnaround Time = Sum of all turnaround times / Number of processes
        const avgWT = (this.metrics.reduce((sum, m) => sum + m.waitingTime, 0) / this.metrics.length).toFixed(2);
        const avgTAT = (this.metrics.reduce((sum, m) => sum + m.turnaroundTime, 0) / this.metrics.length).toFixed(2);
        const avgRT = (this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / this.metrics.length).toFixed(2);

        document.getElementById('avgWT').textContent = avgWT;
        document.getElementById('avgTAT').textContent = avgTAT;
        
        // Add average response time display if element exists
        const avgRTElement = document.getElementById('avgRT');
        if (avgRTElement) {
            avgRTElement.textContent = avgRT;
        }

        // Sort metrics by process ID for consistent display
        const sortedMetrics = [...this.metrics].sort((a, b) => {
            const aNum = parseInt(a.processId.substring(1));
            const bNum = parseInt(b.processId.substring(1));
            return aNum - bNum;
        });

        tbody.innerHTML = sortedMetrics.map(metric => {
            // Validate theoretical formulas:
            // Turnaround Time = Completion Time - Arrival Time ✓
            // Waiting Time = Turnaround Time - Burst Time ✓
            // Response Time = First Execution Time - Arrival Time ✓
            
            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center space-x-2">
                            <div class="w-3 h-3 rounded-full" style="background-color: ${metric.color}"></div>
                            <span class="text-sm font-medium text-gray-900 dark:text-white">${metric.processId}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${metric.arrivalTime}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${metric.burstTime}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${metric.completionTime}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${metric.turnaroundTime}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${metric.waitingTime}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${metric.responseTime}</td>
                </tr>
            `;
        }).join('');

        container.classList.remove('hidden');
        container.classList.add('fade-in');
    }

    exportChart() {
        if (this.ganttData.length === 0) {
            this.showError('No chart data to export');
            return;
        }

        const svg = document.querySelector('#ganttChartContainer svg');
        if (!svg) return;

        // Get the actual dimensions from the viewBox or default values
        const viewBox = svg.getAttribute('viewBox');
        let width = parseInt(svg.getAttribute('width')) || 800;
        let height = parseInt(svg.getAttribute('height')) || 200;
        
        if (viewBox) {
            const viewBoxValues = viewBox.split(' ');
            width = parseInt(viewBoxValues[2]);
            height = parseInt(viewBoxValues[3]);
        }

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        // Set canvas size with high DPI for better quality
        const scaleFactor = 2;
        canvas.width = width * scaleFactor;
        canvas.height = height * scaleFactor;
        ctx.scale(scaleFactor, scaleFactor);

        img.onload = () => {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gantt-chart-${this.currentAlgorithm}-${new Date().toISOString().slice(0, 10)}.png`;
                a.click();
                URL.revokeObjectURL(url);
            });
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }

    exportCSV() {
        if (this.metrics.length === 0) {
            this.showError('No metrics data to export');
            return;
        }

        const headers = ['Process', 'Arrival Time', 'Burst Time', 'Completion Time', 'Turnaround Time', 'Waiting Time', 'Response Time'];
        const csvContent = [
            headers.join(','),
            ...this.metrics.map(m => [
                m.processId,
                m.arrivalTime,
                m.burstTime,
                m.completionTime,
                m.turnaroundTime,
                m.waitingTime,
                m.responseTime
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cpu-scheduling-metrics-${this.currentAlgorithm}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    hideResults() {
        document.getElementById('ganttChartContainer').innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400">
                <i class="fas fa-chart-bar text-4xl mb-4 opacity-50"></i>
                <p class="text-lg font-medium mb-2">Gantt Chart will appear here</p>
                <p class="text-sm">Add processes and select an algorithm to visualize</p>
            </div>
        `;
        document.getElementById('processLegend').classList.add('hidden');
        document.getElementById('metricsContainer').classList.add('hidden');
        document.getElementById('algorithmIndicator').classList.add('hidden');
    }

    clearAlgorithmSelection() {
        document.querySelectorAll('.algorithm-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.getElementById('roundRobinSettings').classList.add('hidden');
    }

    showError(message) {
        // Create or update error notification
        let notification = document.querySelector('.error-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'error-notification fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.classList.remove('translate-x-full');

        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the scheduler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.scheduler = new CPUScheduler();
    
    // Add some sample processes for demonstration
    const samples = [
        { id: 'P1', at: 0, bt: 5, priority: 1 },
        { id: 'P2', at: 2, bt: 3, priority: 2 },
        { id: 'P3', at: 1, bt: 8, priority: 3 }
    ];

    // Uncomment to add sample data
    /*
    samples.forEach(sample => {
        document.getElementById('processId').value = sample.id;
        document.getElementById('arrivalTime').value = sample.at;
        document.getElementById('burstTime').value = sample.bt;
        document.getElementById('priority').value = sample.priority;
        scheduler.addProcess();
    });
    */

    // Set initial process ID
    document.getElementById('processId').value = 'P1';
});
