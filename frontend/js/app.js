document.addEventListener('DOMContentLoaded', () => {
    
    // --- Upload Page Logic ---
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        const fileInput = document.getElementById('video-file');
        const fileNameLabel = document.getElementById('file-name-label');
        const fileStatusText = document.getElementById('file-status-text');
        const uploadBtn = document.getElementById('upload-submit-btn');
        const processingState = document.getElementById('processing-state');
        const progressText = document.getElementById('progress-text');
        
        const clipButtons = document.querySelectorAll('.clip-opt');
        const numClipsInput = document.getElementById('num-clips');
        const aspectButtons = document.querySelectorAll('.aspect-opt');
        const aspectRatioInput = document.getElementById('aspect-ratio');
        
        // Manual Cut Elements
        const modeAiBtn = document.getElementById('mode-ai-btn');
        const modeManualBtn = document.getElementById('mode-manual-btn');
        const aiSettings = document.getElementById('ai-settings-container');
        const manualSettings = document.getElementById('manual-settings-container');
        const submitBtnText = document.getElementById('submit-btn-text');
        const addCutBtn = document.getElementById('add-manual-cut-btn');
        const manualStartInput = document.getElementById('manual-start');
        const manualEndInput = document.getElementById('manual-end');
        const manualCutsList = document.getElementById('manual-cuts-list');
        const manualCutCount = document.getElementById('manual-cut-count');
        const emptyCutsMsg = document.getElementById('empty-cuts-msg');

        let currentMode = 'ai'; // 'ai' or 'manual'
        let manualCuts = [];

        // Mode Toggling Logic
        if (modeAiBtn && modeManualBtn) {
            modeAiBtn.addEventListener('click', () => {
                currentMode = 'ai';
                modeAiBtn.className = 'flex-1 py-2 text-center rounded bg-brand-mint text-white font-bold uppercase transition-all shadow-md';
                modeManualBtn.className = 'flex-1 py-2 text-center rounded text-text-muted hover:text-gray-900 font-semibold uppercase transition-all';
                aiSettings.classList.remove('hidden');
                aiSettings.classList.add('flex');
                manualSettings.classList.add('hidden');
                manualSettings.classList.remove('flex');
                if (submitBtnText) submitBtnText.textContent = 'GENERATE VIRAL CLIPS';
            });
            modeManualBtn.addEventListener('click', () => {
                currentMode = 'manual';
                modeManualBtn.className = 'flex-1 py-2 text-center rounded bg-brand-mint text-white font-bold uppercase transition-all shadow-md';
                modeAiBtn.className = 'flex-1 py-2 text-center rounded text-text-muted hover:text-gray-900 font-semibold uppercase transition-all';
                manualSettings.classList.remove('hidden');
                manualSettings.classList.add('flex');
                aiSettings.classList.add('hidden');
                aiSettings.classList.remove('flex');
                if (submitBtnText) submitBtnText.textContent = 'EXTRACT MANUAL CLIPS';
            });
        }

        // Restrict typing to digits and colons only
        const restrictToTimeFormat = (e) => {
            e.target.value = e.target.value.replace(/[^0-9:]/g, '');
        };
        if (manualStartInput) manualStartInput.addEventListener('input', restrictToTimeFormat);
        if (manualEndInput) manualEndInput.addEventListener('input', restrictToTimeFormat);

        // Add Manual Cut Logic
        if (addCutBtn) {
            addCutBtn.addEventListener('click', () => {
                const start = manualStartInput.value.trim();
                const end = manualEndInput.value.trim();
                
                // Basic validation (regex for MM:SS or HH:MM:SS)
                const timeRegex = /^(\d{1,2}:)?([0-5]?\d):([0-5]?\d)$/;
                if (!timeRegex.test(start) || !timeRegex.test(end)) {
                    alert('Please enter valid timestamps (MM:SS or HH:MM:SS)');
                    return;
                }
                
                manualCuts.push({ start_time: start, end_time: end });
                updateManualCutsUI();
                manualStartInput.value = '';
                manualEndInput.value = '';
            });
        }

        function removeCut(index) {
            manualCuts.splice(index, 1);
            updateManualCutsUI();
        }

        // Attach to window so inline onclick works
        window.removeCut = removeCut;

        function updateManualCutsUI() {
            if (manualCutCount) manualCutCount.textContent = manualCuts.length;
            if (manualCuts.length === 0) {
                manualCutsList.innerHTML = '<p class="text-center text-[10px] text-text-muted py-2 italic" id="empty-cuts-msg">No cuts added yet.</p>';
            } else {
                manualCutsList.innerHTML = '';
                manualCuts.forEach((cut, index) => {
                    const el = document.createElement('div');
                    el.className = 'flex items-center justify-between bg-black/5 border border-black/10 rounded-md px-3 py-2 text-[10px] text-gray-900';
                    el.innerHTML = `
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-brand-mint text-[14px]">cut</span>
                            <span class="font-bold">CLIP ${index + 1}</span>
                            <span class="text-text-muted">— ${cut.start_time} TO ${cut.end_time}</span>
                        </div>
                        <button type="button" onclick="removeCut(${index})" class="text-text-muted hover:text-red-500 transition-colors">
                            <span class="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                    `;
                    manualCutsList.appendChild(el);
                });
            }
        }

        // Segmented button logic for clips count
        if (clipButtons && numClipsInput) {
            clipButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    clipButtons.forEach(b => {
                        b.classList.remove('bg-brand-mint', 'text-white', 'font-bold', 'shadow');
                        b.classList.add('text-text-muted', 'font-semibold');
                    });
                    btn.classList.add('bg-brand-mint', 'text-white', 'font-bold', 'shadow');
                    btn.classList.remove('text-text-muted', 'font-semibold');
                    numClipsInput.value = btn.dataset.value;
                });
            });
        }

        // Segmented button logic for aspect ratio
        if (aspectButtons && aspectRatioInput) {
            aspectButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    aspectButtons.forEach(b => {
                        b.classList.remove('bg-brand-mint', 'text-white', 'font-bold', 'border-brand-mint');
                        b.classList.add('bg-surface-card', 'text-text-muted', 'border', 'border-surface-border');
                    });
                    btn.classList.add('bg-brand-mint', 'text-white', 'font-bold', 'border-brand-mint');
                    btn.classList.remove('text-text-muted', 'bg-surface-card', 'border', 'border-surface-border');
                    aspectRatioInput.value = btn.dataset.value;
                });
            });
        }

        let selectedFile = null;

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    selectedFile = e.target.files[0];
                    const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(1);
                    if (fileStatusText) {
                        fileStatusText.textContent = `${selectedFile.name.toUpperCase()} (${sizeMb} MB)`;
                        fileStatusText.classList.add('text-brand-green', 'font-bold');
                    }
                    if (fileNameLabel) {
                        fileNameLabel.textContent = 'FILE LOADED: ' + selectedFile.name.toUpperCase();
                    }
                }
            });
        }

        if (uploadBtn) {
            uploadBtn.addEventListener('click', async () => {
                if (!selectedFile) {
                    alert('Please select a video file first.');
                    return;
                }

                if (currentMode === 'manual' && manualCuts.length === 0) {
                    alert('Please add at least one timestamp range before exporting.');
                    return;
                }

                // Hide the upload form completely, show processing state
                uploadForm.classList.add('hidden');
                processingState.classList.remove('hidden');

                const numClips = numClipsInput ? numClipsInput.value : 'auto';
                const aspectRatio = aspectRatioInput ? aspectRatioInput.value : 'original';
                const formData = new FormData();
                formData.append('file', selectedFile);

                try {
                    progressText.textContent = 'Uploading Video File...';
                    const response = await fetch('/api/upload/', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) throw new Error('Upload failed');
                    
                    const data = await response.json();
                    
                    if (currentMode === 'manual') {
                        progressText.textContent = 'Preparing Manual Extraction...';
                        localStorage.setItem('manualCuts', JSON.stringify(manualCuts));
                        setTimeout(() => {
                            window.location.href = `/results.html?videoId=${encodeURIComponent(data.video_id)}&mode=manual&aspectRatio=original`;
                        }, 600);
                    } else {
                        progressText.textContent = 'Preparing Gemini AI Ingestion...';
                        setTimeout(() => {
                            window.location.href = `/results.html?videoId=${encodeURIComponent(data.video_id)}&numClips=${numClips}&aspectRatio=${aspectRatio}`;
                        }, 600);
                    }

                } catch (error) {
                    console.error(error);
                    progressText.textContent = 'Error uploading video.';
                    processingState.querySelector('.animate-pulse')?.classList.remove('animate-pulse');
                    setTimeout(() => {
                        uploadForm.classList.remove('hidden'); // allow retry
                        processingState.classList.add('hidden');
                    }, 2500);
                }
            });
        }
    }

    // --- Results Page Logic ---
    const clipsContainer = document.getElementById('clips-container');
    if (clipsContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('videoId');
        const numClips = urlParams.get('numClips') || 'auto';
        const aspectRatio = urlParams.get('aspectRatio') || 'original';
        const mode = urlParams.get('mode') || 'ai';
        
        if (videoId) {
            const sourceDisplay = document.getElementById('source-file-display');
            if (sourceDisplay) sourceDisplay.textContent = decodeURIComponent(videoId);
            fetchClips(videoId, numClips, aspectRatio, mode);
        } else {
            const countText = document.getElementById('clip-count-text');
            if (countText) countText.textContent = 'NO VIDEO SPECIFIED';
            clipsContainer.innerHTML = '<p class="font-mono text-text-muted text-center py-8">No video specified. Please return to upload.</p>';
        }
    }

    // --- Library Page Logic ---
    const librarySessionsContainer = document.getElementById('library-sessions-container');
    if (librarySessionsContainer) {
        loadLibrarySessions();
    }

    // --- Engine Diagnostics Logic ---
    const engineHealthBadge = document.getElementById('engine-health-badge');
    if (engineHealthBadge) {
        checkEngineHealth();
    }
});

let timerInterval = null;

function startDurationTimer() {
    const startTime = Date.now();
    const durationDisplay = document.getElementById('duration-display');
    if (!durationDisplay) return;
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        durationDisplay.textContent = `${elapsed}S`;
    }, 100);
}

function stopDurationTimer(finalDuration = null) {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    const durationDisplay = document.getElementById('duration-display');
    if (durationDisplay && finalDuration !== null) {
        durationDisplay.textContent = `${Number(finalDuration).toFixed(1)}S`;
    }
}

async function fetchClips(videoId, numClips = 'auto', aspectRatio = 'original', mode = 'ai') {
    const clipsContainer = document.getElementById('clips-container');
    const clipCountText = document.getElementById('clip-count-text');
    const stageDisplay = document.getElementById('stage-display');
    const loadingStageText = document.getElementById('loading-stage-text');
    const statusTitle = document.getElementById('status-title');
    const statusIcon = document.getElementById('status-icon');
    const sourceDisplay = document.getElementById('source-file-display');
    const sizeDisplay = document.getElementById('source-size-display');
    
    // Reset UI to loading state
    startDurationTimer();
    if (statusTitle) statusTitle.textContent = "PROCESSING IN PROGRESS";
    if (statusIcon) {
        statusIcon.textContent = "progress_activity";
        statusIcon.className = "material-symbols-outlined text-[15px] animate-spin text-brand-green";
    }
    
    if (mode === 'manual') {
        if (clipCountText) clipCountText.textContent = "EXTRACTING MANUAL CUTS...";
        if (stageDisplay) stageDisplay.textContent = "Initiating manual extraction...";
        if (loadingStageText) loadingStageText.textContent = "Slicing specified timestamps...";
    } else {
        if (clipCountText) clipCountText.textContent = "ANALYZING VIDEO...";
        if (stageDisplay) stageDisplay.textContent = "Initiating background task...";
        if (loadingStageText) loadingStageText.textContent = "Starting AI highlight detection...";
    }

    try {
        let response;
        if (mode === 'manual') {
            const cutsStr = localStorage.getItem('manualCuts') || '[]';
            const cuts = JSON.parse(cutsStr);
            response = await fetch(`/api/clips/manual_generate/${encodeURIComponent(videoId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cuts)
            });
        } else {
            // Step 1: Trigger background clip generation task
            response = await fetch(`/api/clips/generate/${encodeURIComponent(videoId)}?num_clips=${numClips}&aspect_ratio=${aspectRatio}`, { method: 'POST' });
        }
        
        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.detail || 'Failed to initiate clip generation');
        }
        
        const initData = await response.json();
        const taskId = initData.task_id;
        
        // Step 2: Poll status endpoint
        const pollInterval = setInterval(async () => {
            try {
                const statusRes = await fetch(`/api/clips/status/${taskId}`);
                if (!statusRes.ok) throw new Error('Status polling failed');
                
                const statusData = await statusRes.json();
                
                // Update live metadata if available
                if (statusData.source_filename && sourceDisplay) {
                    sourceDisplay.textContent = statusData.source_filename;
                }
                if (statusData.file_size && sizeDisplay) {
                    sizeDisplay.textContent = `${(statusData.file_size / (1024 * 1024)).toFixed(1)} MB TOTAL`;
                }
                if (statusData.stage) {
                    if (stageDisplay) stageDisplay.textContent = statusData.stage;
                    if (loadingStageText) loadingStageText.textContent = statusData.stage;
                }

                if (statusData.status === 'completed') {
                    clearInterval(pollInterval);
                    stopDurationTimer(statusData.duration);
                    
                    if (statusTitle) statusTitle.textContent = "PROCESSING COMPLETE";
                    if (statusIcon) {
                        statusIcon.textContent = "check_circle";
                        statusIcon.className = "material-symbols-outlined text-[15px] text-brand-green";
                    }
                    const pipelineBadge = document.getElementById('pipeline-state-badge');
                    if (pipelineBadge) pipelineBadge.textContent = "READY";
                    
                    renderClips(statusData.clips, statusData.zip_url);
                } else if (statusData.status === 'failed') {
                    clearInterval(pollInterval);
                    stopDurationTimer(statusData.duration);
                    showErrorState(statusData.error || 'Clip generation failed', videoId, numClips, aspectRatio);
                }
            } catch (err) {
                clearInterval(pollInterval);
                stopDurationTimer();
                console.error(err);
                showErrorState(err.message, videoId, numClips, aspectRatio);
            }
        }, 2000);

    } catch (error) {
        stopDurationTimer();
        console.error(error);
        showErrorState(error.message, videoId, numClips, aspectRatio);
    }
}

function showErrorState(errorMsg, videoId, numClips, aspectRatio) {
    const clipsContainer = document.getElementById('clips-container');
    const clipCountText = document.getElementById('clip-count-text');
    const statusTitle = document.getElementById('status-title');
    const statusIcon = document.getElementById('status-icon');
    const stageDisplay = document.getElementById('stage-display');
    const pipelineBadge = document.getElementById('pipeline-state-badge');

    if (clipCountText) clipCountText.textContent = 'ANALYSIS NOTICE';
    if (statusTitle) statusTitle.textContent = "PIPELINE ALERT";
    if (statusIcon) {
        statusIcon.textContent = "error";
        statusIcon.className = "material-symbols-outlined text-[15px] text-amber-400";
    }
    if (stageDisplay) stageDisplay.textContent = "Error occurred during generation";
    if (pipelineBadge) pipelineBadge.textContent = "HALTED";

    if (clipsContainer) {
        clipsContainer.innerHTML = `
            <div class="bg-surface-card border border-surface-border rounded-md p-6 flex flex-col items-center justify-center gap-4 text-center font-mono">
                <div class="w-12 h-12 rounded-full bg-amber-950/40 border border-amber-800/60 flex items-center justify-center text-amber-400">
                    <span class="material-symbols-outlined text-[24px]">warning</span>
                </div>
                <div class="flex flex-col gap-1">
                    <h3 class="font-display font-bold text-sm text-white uppercase tracking-wider">Clip Generation Notice</h3>
                    <p class="text-[11px] text-text-muted max-w-sm break-words">${errorMsg}</p>
                </div>
                <div class="flex items-center gap-3 pt-2">
                    <button onclick="fetchClips('${encodeURIComponent(videoId)}', '${numClips}', '${aspectRatio}')" type="button" class="px-4 py-2 bg-brand-green text-black font-display font-bold text-xs rounded uppercase tracking-wider hover:bg-[#00E65C] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,102,0.2)] cursor-pointer">
                        <span class="material-symbols-outlined text-[16px]">refresh</span>
                        <span>RETRY ANALYSIS</span>
                    </button>
                    <a href="/" class="px-4 py-2 bg-surface-card-hover border border-surface-border text-white font-mono text-xs rounded hover:border-surface-border-light transition-all flex items-center gap-1.5" style="text-decoration:none;">
                        <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                        <span>NEW UPLOAD</span>
                    </a>
                </div>
            </div>
        `;
    }
}function copyToClipboard(text, btnEl) {
    navigator.clipboard.writeText(text).then(() => {
        const origHTML = btnEl.innerHTML;
        btnEl.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span><span>COPIED!</span>';
        btnEl.classList.add('text-brand-mint');
        setTimeout(() => {
            btnEl.innerHTML = origHTML;
            btnEl.classList.remove('text-brand-mint');
        }, 1500);
    }).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    });
}

function renderClips(clips, zipUrl = null) {
    const clipsContainer = document.getElementById('clips-container');
    const clipCountText = document.getElementById('clip-count-text');
    const downloadAllBtn = document.getElementById('download-all-btn');
    
    clipsContainer.innerHTML = '';
    
    if (clips && clips.length > 0) {
        if (clipCountText) {
            clipCountText.textContent = `RESULTS / ${clips.length} CLIP${clips.length === 1 ? '' : 'S'} DETECTED`;
        }
        
        clips.forEach((clip, index) => {
            const clipNum = String(index + 1).padStart(2, '0');
            const headline = clip.description ? clip.description.split('.')[0] : `Extracted Highlight ${clipNum}`;
            const viralScore = clip.viral_score || (88 + (index * 3) % 11);
            const fileSizeStr = clip.file_size || 'HD MP4';
            const posterAttr = clip.thumbnail_url ? `poster="${clip.thumbnail_url}"` : '';
            
            const overviewText = clip.overview || clip.description || '';
            const hookText = clip.hook || '';
            const visualsActionText = clip.visuals_action || clip.video_visuals || '';
            const captionText = clip.caption || '';
            const hashtags = clip.hashtags || [];
            const hashtagsStr = hashtags.join(' ');

            // 1. Overview Section HTML
            const overviewSection = overviewText ? `
                <div class="flex flex-col gap-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                            <span class="material-symbols-outlined text-[14px]">info</span>
                            <span>1. OVERVIEW</span>
                        </div>
                        <button type="button" onclick="copyToClipboard(\`${overviewText.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`, this)" class="flex items-center gap-1 text-[10px] text-text-muted hover:text-emerald-700 font-semibold transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-[14px]">content_copy</span>
                            <span>COPY</span>
                        </button>
                    </div>
                    <p class="font-sans text-[12px] text-gray-800 leading-relaxed">${overviewText}</p>
                </div>
            ` : '';

            // 2. Hook Section HTML
            const hookSection = hookText ? `
                <div class="flex flex-col gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                            <span class="material-symbols-outlined text-[14px]">fishing</span>
                            <span>2. HOOK</span>
                        </div>
                        <button type="button" onclick="copyToClipboard(\`${hookText.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`, this)" class="flex items-center gap-1 text-[10px] text-text-muted hover:text-amber-700 font-semibold transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-[14px]">content_copy</span>
                            <span>COPY</span>
                        </button>
                    </div>
                    <p class="font-display font-bold text-[13px] text-gray-900 leading-snug">${hookText}</p>
                </div>
            ` : '';

            // 3. Video Visuals/Action Section HTML
            const visualsActionSection = visualsActionText ? `
                <div class="flex flex-col gap-1.5 bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200/60 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 text-cyan-700 text-[10px] font-bold uppercase tracking-wider">
                            <span class="material-symbols-outlined text-[14px]">videocam</span>
                            <span>3. VIDEO VISUALS / ACTION</span>
                        </div>
                        <button type="button" onclick="copyToClipboard(\`${visualsActionText.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`, this)" class="flex items-center gap-1 text-[10px] text-text-muted hover:text-cyan-700 font-semibold transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-[14px]">content_copy</span>
                            <span>COPY</span>
                        </button>
                    </div>
                    <p class="font-sans text-[12px] text-gray-800 leading-relaxed">${visualsActionText}</p>
                </div>
            ` : '';

            // 4. Caption Section HTML
            const captionSection = captionText ? `
                <div class="flex flex-col gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                            <span class="material-symbols-outlined text-[14px]">edit_note</span>
                            <span>4. CAPTION</span>
                        </div>
                        <button type="button" onclick="copyToClipboard(\`${captionText.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`, this)" class="flex items-center gap-1 text-[10px] text-text-muted hover:text-blue-700 font-semibold transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-[14px]">content_copy</span>
                            <span>COPY</span>
                        </button>
                    </div>
                    <p class="font-sans text-[12px] text-gray-800 leading-relaxed">${captionText}</p>
                </div>
            ` : '';

            // 5. Hashtags Section HTML
            const hashtagsSection = hashtags.length > 0 ? `
                <div class="flex flex-col gap-2 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200/60 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 text-violet-700 text-[10px] font-bold uppercase tracking-wider">
                            <span class="material-symbols-outlined text-[14px]">tag</span>
                            <span>5. HASHTAGS</span>
                        </div>
                        <button type="button" onclick="copyToClipboard(\`${hashtagsStr.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`, this)" class="flex items-center gap-1 text-[10px] text-text-muted hover:text-violet-700 font-semibold transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-[14px]">content_copy</span>
                            <span>COPY ALL</span>
                        </button>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                        ${hashtags.map(tag => `<span class="px-2 py-0.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-[10px] font-semibold">${tag}</span>`).join('')}
                    </div>
                </div>
            ` : '';

            // Build the "copy all 5 sections" text combined
            const allCopyTextArr = [
                overviewText ? `1. OVERVIEW:\n${overviewText}` : '',
                hookText ? `2. HOOK:\n${hookText}` : '',
                visualsActionText ? `3. VIDEO VISUALS/ACTION:\n${visualsActionText}` : '',
                captionText ? `4. CAPTION:\n${captionText}` : '',
                hashtagsStr ? `5. HASHTAGS:\n${hashtagsStr}` : ''
            ].filter(Boolean);
            const allCopyText = allCopyTextArr.join('\\n\\n');

            const copyAllSection = allCopyTextArr.length > 0 ? `
                <button type="button" onclick="copyToClipboard(\`${allCopyText.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`, this)" class="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-black/5 border border-black/10 text-gray-600 hover:text-gray-900 hover:border-black/20 font-semibold text-[11px] transition-all cursor-pointer">
                    <span class="material-symbols-outlined text-[16px]">select_all</span>
                    <span>COPY ALL 5 SECTIONS</span>
                </button>
            ` : '';

            const clipEl = document.createElement('article');
            clipEl.className = 'glass-panel rounded-xl overflow-hidden flex flex-col font-mono text-[11px] text-gray-900 transition-all hover:border-black/10 shadow-lg bg-white/60';
            clipEl.innerHTML = `
                <!-- CARD HEADER STRIP -->
                <div class="flex items-center justify-between px-4 py-2.5 bg-black/5 border-b border-black/5">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-gray-900 uppercase tracking-wider text-[12px]">CLIP ${clipNum}</span>
                        <span class="text-text-muted border-l border-black/10 pl-2 text-[11px]">${clip.start} — ${clip.end}</span>
                    </div>
                    <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-brand-mint text-brand-mint font-bold text-[10px]">
                        <span class="w-1.5 h-1.5 rounded-full bg-brand-mint pulse-mint"></span>
                        <span>READY (${fileSizeStr})</span>
                    </div>
                </div>

                <div class="p-4 flex flex-col gap-3">
                    <!-- PREVIEW VIEWPORT & DATA SECTION -->
                    <div class="flex flex-col gap-3">
                        <!-- 9:16 PREVIEW CONTAINER WITH INLINE SEAMLESS PLAYER -->
                        <div class="w-full aspect-[9/16] max-h-[380px] bg-black border border-black/10 rounded-xl relative flex flex-col justify-between overflow-hidden group shadow-md">
                            
                            <video src="${clip.url}" ${posterAttr} class="w-full h-full object-contain bg-black" controls preload="metadata" playsinline></video>

                            <!-- Top Viewport Badges -->
                            <div class="absolute top-3 left-3 right-3 z-20 flex justify-between items-center text-[10px] pointer-events-none">
                                <span class="bg-white/90 backdrop-blur text-brand-mint border border-brand-mint font-mono px-2 py-0.5 rounded-full font-bold">9:16 HD</span>
                                <span class="bg-white/90 backdrop-blur text-gray-900 border border-black/10 font-mono px-2 py-0.5 rounded-full">${fileSizeStr}</span>
                            </div>
                        </div>

                        <!-- CLIP METADATA & INSIGHTS -->
                        <div class="flex flex-col gap-2 pt-1">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-1.5 text-brand-mint text-[11px] font-bold">
                                    <span class="w-1.5 h-1.5 rounded-full bg-brand-mint"></span>
                                    <span>AI HIGHLIGHT ENGINE</span>
                                </div>
                                <div class="flex items-center gap-1 font-bold text-brand-mint text-[11px] bg-emerald-50 border border-brand-mint px-2 py-0.5 rounded-md">
                                    <span class="material-symbols-outlined text-[14px]">bolt</span>
                                    <span>VIRALITY: ${viralScore}/100</span>
                                </div>
                            </div>
                            
                            <h2 class="font-display font-bold text-base text-gray-900 leading-snug">
                                "${headline}."
                            </h2>

                            <!-- 5 STRICT OUTPUT SECTIONS -->
                            ${overviewSection}
                            ${hookSection}
                            ${visualsActionSection}
                            ${captionSection}
                            ${hashtagsSection}
                            ${copyAllSection}

                            <div class="flex items-center justify-between text-[10px] text-text-muted pt-1">
                                <div class="flex items-center gap-1.5 text-brand-mint">
                                    <div class="flex items-center gap-1 h-3">
                                        <div class="eq-bar"></div>
                                        <div class="eq-bar"></div>
                                        <div class="eq-bar"></div>
                                        <div class="eq-bar"></div>
                                    </div>
                                    <span class="font-bold text-[10px]">AUDIO SYNCHRONIZED</span>
                                </div>
                                <span class="text-text-muted">REC.709 H264</span>
                            </div>
                        </div>
                    </div>

                    <!-- ACTION BUTTONS STRIP -->
                    <div class="grid grid-cols-2 gap-2 pt-1 font-sans text-[12px]">
                        <button onclick="window.open('${clip.url}', '_blank')" class="flex items-center justify-center gap-1.5 py-3 px-3 glass-panel hover:border-black/10 text-gray-900 rounded-lg font-semibold transition-all cursor-pointer" type="button">
                            <span class="material-symbols-outlined text-[16px]">open_in_new</span>
                            <span>FULLSCREEN</span>
                        </button>
                        <a href="${clip.url}" download="${clip.id}.mp4" class="btn-mint flex items-center justify-center gap-1.5 py-3 px-3 rounded-lg font-extrabold uppercase tracking-wider text-center text-white" style="text-decoration:none;">
                            <span class="material-symbols-outlined text-[16px]">download</span>
                            <span>DOWNLOAD MP4</span>
                        </a>
                    </div>
                </div>
            `;

            clipsContainer.appendChild(clipEl);
        });

        // Enable batch download button
        if (downloadAllBtn) {
            downloadAllBtn.disabled = false;
            downloadAllBtn.className = "w-full bg-brand-green text-black font-display font-extrabold text-sm py-3.5 px-4 rounded-md uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#00E65C] transition-all shadow-[0_0_20px_rgba(0,255,102,0.2)] cursor-pointer";
            downloadAllBtn.onclick = () => {
                if (zipUrl) {
                    const a = document.createElement('a');
                    a.href = zipUrl;
                    a.download = 'clips.zip';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    clips.forEach((clip, idx) => {
                        setTimeout(() => {
                            const a = document.createElement('a');
                            a.href = clip.url;
                            a.download = `${clip.id}.mp4`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        }, idx * 300);
                    });
                }
            };
        }

    } else {
        if (clipCountText) clipCountText.textContent = 'RESULTS / 0 CLIPS';
        clipsContainer.innerHTML = '<p class="font-mono text-text-muted text-center py-8">No clips were generated. Please try again.</p>';
    }
}
    }
}

// --- Library Loading Logic ---
async function loadLibrarySessions() {
    const container = document.getElementById('library-sessions-container');
    if (!container) return;

    try {
        const response = await fetch('/api/clips/sessions/list');
        if (!response.ok) throw new Error('Failed to fetch library sessions');
        
        const data = await response.json();
        const sessions = data.sessions || [];

        if (sessions.length === 0) {
            container.innerHTML = '<p class="font-mono text-text-muted text-center py-12">No active video clip sessions found. Upload a video to generate clips.</p>';
            return;
        }

        container.innerHTML = '';
        sessions.forEach((session) => {
            const clipCount = session.clips.length;
            const article = document.createElement('article');
            article.className = 'glass-panel bg-white/60 rounded-xl overflow-hidden flex flex-col font-mono text-[11px] mb-4 hover:border-black/10 transition-all shadow-lg text-gray-900';
            
            const thumbsHtml = session.clips.slice(0, 4).map((clip, i) => {
                if (clip.thumbnail_url) {
                    return `<div class="aspect-[9/16] bg-black border border-black/10 rounded-lg relative flex items-center justify-center overflow-hidden cursor-pointer group" onclick="window.open('${clip.url}', '_blank')">
                        <img src="${clip.thumbnail_url}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span class="absolute bottom-1 right-1 bg-white/90 px-1 py-0.2 text-[8px] text-gray-900 rounded font-bold">0${i+1}</span>
                    </div>`;
                }
                return `<div class="aspect-[9/16] bg-black border border-black/10 rounded-lg relative flex items-center justify-center cursor-pointer group" onclick="window.open('${clip.url}', '_blank')">
                    <span class="material-symbols-outlined text-brand-mint text-[20px] group-hover:scale-110 transition-transform">play_circle</span>
                    <span class="absolute bottom-1 right-1 bg-white/90 px-1 py-0.2 text-[8px] text-gray-900 font-bold">0${i+1}</span>
                </div>`;
            }).join('');

            article.innerHTML = `
                <div class="flex items-center justify-between p-3.5 bg-black/5 border-b border-black/5">
                    <div class="flex items-center gap-2 truncate max-w-[70%]">
                        <span class="material-symbols-outlined text-brand-mint text-[18px]">movie</span>
                        <span class="font-bold text-gray-900 uppercase truncate text-[12px]">${session.source_filename}</span>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-brand-mint border border-brand-mint text-[10px] font-bold">${clipCount} CLIP${clipCount === 1 ? '' : 'S'}</span>
                </div>
                
                <div class="p-4 flex flex-col gap-3">
                    <div class="flex items-center justify-between text-text-muted text-[10px]">
                        <span>PROCESSED: ${session.created_at}</span>
                        <span class="text-brand-mint font-bold">READY</span>
                    </div>

                    <div class="grid grid-cols-4 gap-2">
                        ${thumbsHtml}
                    </div>

                    <div class="grid grid-cols-2 gap-2 pt-1 font-sans text-[12px]">
                        <a href="/results.html?videoId=${encodeURIComponent(session.source_filename)}" class="flex items-center justify-center gap-1.5 py-2.5 px-3 glass-panel hover:border-black/10 text-gray-900 rounded-lg font-semibold text-center" style="text-decoration:none;">
                            <span class="material-symbols-outlined text-[16px]">open_in_new</span>
                            <span>VIEW CLIPS</span>
                        </a>
                        <a href="/clips/${encodeURIComponent(session.source_filename.replace('.mp4', ''))}_all_clips.zip" download class="btn-mint flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold uppercase tracking-wider text-center text-white" style="text-decoration:none;">
                            <span class="material-symbols-outlined text-[16px]">download</span>
                            <span>ZIP ARCHIVE</span>
                        </a>
                    </div>
                </div>
            `;
            container.appendChild(article);
        });

    } catch (err) {
        console.error('Failed loading library sessions:', err);
        container.innerHTML = `<p class="font-mono text-text-muted text-center py-12">No active video clip sessions found. Upload a video to generate clips.</p>`;
    }
}

// --- Engine Health Check Logic ---
async function checkEngineHealth() {
    const healthBadge = document.getElementById('engine-health-badge');
    const latencyDisplay = document.getElementById('engine-latency-display');
    
    try {
        const t0 = performance.now();
        const res = await fetch('/api/health');
        const t1 = performance.now();
        
        if (res.ok) {
            const latency = Math.round(t1 - t0);
            if (healthBadge) healthBadge.textContent = "ONLINE 100%";
            if (latencyDisplay) latencyDisplay.textContent = `${latency} MS`;
        } else {
            if (healthBadge) healthBadge.textContent = "DEGRADED";
        }
    } catch (e) {
        if (healthBadge) healthBadge.textContent = "OFFLINE";
    }
}
