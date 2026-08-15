import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Video, Square, RotateCcw, Send, Trash2, Trophy, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import videoAnswerService from '../../services/videoAnswerService';
import styles from './VideoAnswer.module.css';

const VideoAnswer = ({ documentId }) => {
    const [question, setQuestion] = useState('');
    const [generatingQ, setGeneratingQ] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [recording, setRecording] = useState(false);
    const [recorded, setRecorded] = useState(false);
    const [timer, setTimer] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const recognitionRef = useRef(null);
    const timerRef = useRef(null);
    const chunksRef = useRef([]);

    // Load history
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await videoAnswerService.getAnswers(documentId);
                setHistory(res.data.data);
            } catch { } finally {
                setLoadingHistory(false);
            }
        };
        fetch();
    }, [documentId]);

    // Auto-generate question on mount
    // useEffect(() => {
    //     handleGenerateQuestion();
    // }, []);

    const handleGenerateQuestion = async () => {
        setGeneratingQ(true);
        try {
            const res = await videoAnswerService.generateQuestion(documentId);
            setQuestion(res.data.data.question);
        } catch {
            toast.error('Failed to generate question.');
        } finally {
            setGeneratingQ(false);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            setCameraReady(true);
            // Wait for React to render the video element before setting srcObject
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch {
            toast.error('Could not access camera/microphone. Please allow permissions.');
        }
    };

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        setCameraReady(false);
    };

    const startRecording = () => {
        if (!streamRef.current) return;
        if (videoRef.current) {
            videoRef.current.srcObject = streamRef.current;  fgu7jj 
            videoRef.current.play();
        }

        chunksRef.current = [];
        setTranscript('');

        // MediaRecorder for video
        const mediaRecorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mediaRecorder.start();

        // Web Speech API for transcript
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SR();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            let finalTranscript = '';
            recognition.onresult = (e) => {
                let interim = '';
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + ' ';
                    else interim += e.results[i][0].transcript;
                }
                setTranscript(finalTranscript + interim);
            };
            recognition.start();
            recognitionRef.current = recognition;
        }

        // Timer
        setTimer(0);
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
        setRecording(true);
        setRecorded(false);
        setResult(null);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        recognitionRef.current?.stop();
        clearInterval(timerRef.current);
        setRecording(false);
        setRecorded(true);
    };

    const handleRetry = () => {
        setRecorded(false);
        setTranscript('');
        setResult(null);
        setTimer(0);
    };

    const handleSubmit = async () => {
        if (!transcript.trim()) {
            toast.error('No speech detected. Please try again.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await videoAnswerService.submitAnswer(documentId, {
                question,
                transcript: transcript.trim(),
                duration: timer,
            });
            const data = res.data.data;
            setResult(data);
            setHistory(prev => [data, ...prev]);
            stopCamera();
        } catch {
            toast.error('Failed to submit answer.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await videoAnswerService.deleteAnswer(id);
            setHistory(prev => prev.filter(h => h._id !== id));
        } catch {
            toast.error('Failed to delete.');
        }
    };

    const handleTryAgain = () => {
        setResult(null);
        setRecorded(false);
        setTranscript('');
        setTimer(0);
        startCamera();
    };

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const getScoreClass = (score) => score >= 70 ? styles.scoreHigh : score >= 40 ? styles.scoreMid : styles.scoreLow;
    const getScoreBg = (score) => score >= 70 ? '#ecfdf5' : score >= 40 ? '#fffbeb' : '#fff1f2';
    const getScoreColor = (score) => score >= 70 ? '#059669' : score >= 40 ? '#d97706' : '#e11d48';

    return (
        <div className={styles.container}>

            {/* Question */}
            <div className={styles.questionCard}>
                <p className={styles.cardTitle}>Question</p>
                <textarea
                    className={styles.questionInput}
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Your question will appear here..."
                    rows={3}
                />
                <div className={styles.questionActions}>
                    <button onClick={handleGenerateQuestion} disabled={generatingQ} className={styles.generateBtn}>
                        {generatingQ
                            ? <><span className={styles.spinnerRingDark} /> Generating...</>
                            : <><RefreshCw size={14} strokeWidth={2} /> Generate New Question</>
                        }
                    </button>
                </div>
            </div>

            {/* Camera / Recording */}
            {!result && (
                <div className={styles.cameraCard}>
                    <p className={styles.cardTitle}>Your Answer</p>

                    <div className={styles.videoWrap}>
                        {cameraReady || recording || recorded ? (
                            <video ref={videoRef} autoPlay muted playsInline className={styles.video} style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
                        ) : (
                            <div className={styles.noCamera}>
                                <Video size={40} strokeWidth={1.5} />
                                <p className={styles.noCameraText}>Camera not started</p>
                            </div>
                        )}
                        {recording && (
                            <>
                                <div className={styles.recordingBadge}>
                                    <span className={styles.recordingDot} /> REC
                                </div>
                                <div className={styles.timerBadge}>{formatTime(timer)}</div>
                            </>
                        )}
                        {recorded && !recording && (
                            <div className={styles.timerBadge}>{formatTime(timer)}</div>
                        )}
                    </div>

                    <div className={styles.cameraControls}>
                        {!cameraReady && !recording && !recorded && (
                            <button onClick={startCamera} className={styles.startBtn} disabled={!question.trim()}>
                                <Video size={18} strokeWidth={2} /> Enable Camera
                            </button>
                        )}
                        {cameraReady && !recording && !recorded && (
                            <button onClick={startRecording} className={styles.startBtn} disabled={!question.trim()}>
                                <Video size={18} strokeWidth={2} /> Start Recording
                            </button>
                        )}
                        {recording && (
                            <button onClick={stopRecording} className={styles.stopBtn}>
                                <Square size={16} strokeWidth={2.5} fill="currentColor" /> Stop Recording
                            </button>
                        )}
                        {recorded && !recording && (
                            <>
                                <button onClick={handleRetry} className={styles.retryBtn}>
                                    <RotateCcw size={16} strokeWidth={2} /> Retry
                                </button>
                                <button onClick={handleSubmit} disabled={submitting || !transcript.trim()} className={styles.submitBtn}>
                                    {submitting
                                        ? <><span className={styles.spinnerRing} /> Analysing...</>
                                        : <><Sparkles size={16} strokeWidth={2} /> Analyse Answer</>
                                    }
                                </button>
                            </>
                        )}
                    </div>

                    {transcript && (
                        <div className={styles.transcriptCard}>
                            <p className={styles.transcriptLabel}>Transcript</p>
                            <p className={styles.transcriptText}>{transcript}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Results */}
            {result && (
                <div className={styles.resultsCard}>
                    <div className={styles.scoreRow}>
                        <div className={[styles.scoreCircle, getScoreClass(result.score)].join(' ')}>
                            {result.score}%
                        </div>
                        <div className={styles.scoreInfo}>
                            <p className={styles.scoreLabel}>AI Feedback</p>
                            <p className={styles.feedback}>{result.feedback}</p>
                        </div>
                    </div>

                    <div className={styles.listsRow}>
                        <div className={[styles.listCard, styles.listCardGreen].join(' ')}>
                            <p className={[styles.listTitle, styles.listTitleGreen].join(' ')}>Strengths</p>
                            {result.strengths?.map((s, i) => (
                                <div key={i} className={styles.listItem}>
                                    <span className={[styles.listDot, styles.listDotGreen].join(' ')} />
                                    {s}
                                </div>
                            ))}
                        </div>
                        <div className={[styles.listCard, styles.listCardAmber].join(' ')}>
                            <p className={[styles.listTitle, styles.listTitleAmber].join(' ')}>Improvements</p>
                            {result.improvements?.map((s, i) => (
                                <div key={i} className={styles.listItem}>
                                    <span className={[styles.listDot, styles.listDotAmber].join(' ')} />
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>

                    {result.transcript && (
                        <div className={styles.transcriptCard}>
                            <p className={styles.transcriptLabel}>Your Transcript</p>
                            <p className={styles.transcriptText}>{result.transcript}</p>
                        </div>
                    )}

                    <div className={styles.resultsActions}>
                        <button onClick={handleTryAgain} className={styles.retryBtn}>
                            <RotateCcw size={16} strokeWidth={2} /> Try Again
                        </button>
                        <button onClick={handleGenerateQuestion} className={styles.generateBtn}>
                            <RefreshCw size={14} strokeWidth={2} /> New Question
                        </button>
                    </div>
                </div>
            )}

            {/* History */}
            {history.length > 0 && (
                <div className={styles.historyCard}>
                    <p className={styles.historyTitle}>Past Attempts</p>
                    <div className={styles.historyList}>
                        {history.map((h) => (
                            <div key={h._id} className={styles.historyItem}>
                                <span className={styles.historyQuestion}>{h.question}</span>
                                <span
                                    className={styles.historyScore}
                                    style={{ background: getScoreBg(h.score), color: getScoreColor(h.score) }}
                                >
                                    {h.score}%
                                </span>
                                <span className={styles.historyDate}>{moment(h.createdAt).fromNow()}</span>
                                <button onClick={() => handleDelete(h._id)} className={styles.historyDeleteBtn}>
                                    <Trash2 size={14} strokeWidth={2} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default VideoAnswer;