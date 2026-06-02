import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { QuizQuestion } from '../features/admin/types';

interface MidVideoQuizOverlayProps {
    questions: QuizQuestion[];
    questionTimeLimitSec?: number;
    onComplete: () => void;
}

type AnswerState = 'idle' | 'correct' | 'incorrect';

const MidVideoQuizOverlay: React.FC<MidVideoQuizOverlayProps & { currentTime: number }> = ({ questions, questionTimeLimitSec, onComplete, currentTime }) => {
    const [visibleQuestions, setVisibleQuestions] = useState<number[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answerState, setAnswerState] = useState<AnswerState>('idle');
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isTimeout, setIsTimeout] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const quizAvatars = ['🧠', '🦊', '🐼', '🦉', '🐯', '🐨'];

    // Affiche la question si le timestamp est atteint
    useEffect(() => {
        const toShow = questions
            .map((q, idx) => ({ idx, timestamp: q.timestamp ?? 0 }))
            .filter(q => currentTime >= q.timestamp)
            .map(q => q.idx);
        setVisibleQuestions(toShow);
        if (toShow.length > 0 && currentIndex < toShow.length) {
            setCurrentIndex(toShow.length - 1);
        }
    }, [currentTime, questions]);

    // Fade-in à l'apparition
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 30);
        return () => clearTimeout(timer);
    }, []);

    // Reset quand on passe à la question suivante
    useEffect(() => {
        setSelectedAnswer(null);
        setAnswerState('idle');
        setCorrectAnswerIndex(null);
        setIsTimeout(false);

        if (questionTimeLimitSec && questionTimeLimitSec > 0) {
            setTimeLeft(questionTimeLimitSec);
        } else {
            setTimeLeft(null);
        }
    }, [currentIndex]);

    useEffect(() => {
        if (!questionTimeLimitSec || questionTimeLimitSec <= 0) return;
        if (answerState !== 'idle') return;
        if (timeLeft === null || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev !== null ? prev - 1 : prev));
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, answerState, questionTimeLimitSec]);

    useEffect(() => {
        if (!questionTimeLimitSec || questionTimeLimitSec <= 0) return;
        if (timeLeft !== 0) return;
        if (answerState !== 'idle') return;

        const currentQuestion = questions[currentIndex];
        const correctIdx = currentQuestion.answers.findIndex((a) => a.isCorrect);
        setSelectedAnswer(null);
        setCorrectAnswerIndex(correctIdx);
        setIsTimeout(true);
        setAnswerState('incorrect');
    }, [timeLeft, answerState, questionTimeLimitSec, questions, currentIndex]);

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return null;
    const avatar = quizAvatars[currentIndex % quizAvatars.length];

    const handleSelectAnswer = (index: number) => {
        if (answerState !== 'idle') return;
        setSelectedAnswer(index);
    };

    const handleValidate = () => {
        if (selectedAnswer === null) return;
        const answer = currentQuestion.answers[selectedAnswer];
        const isCorrect = !!answer?.isCorrect;

        // Trouver la bonne réponse pour l'afficher si incorrecte
        const correctIdx = currentQuestion.answers.findIndex((a) => a.isCorrect);
        setCorrectAnswerIndex(correctIdx);
        setAnswerState(isCorrect ? 'correct' : 'incorrect');
    };

    const handleContinue = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((i) => i + 1);
        } else {
            // Fade-out avant de compléter
            setIsExiting(true);
            setTimeout(() => {
                onComplete();
            }, 280);
        }
    };

    const getAnswerClass = (index: number): string => {
        const base =
            'w-full text-left px-5 py-3.5 rounded-xl border transition-all duration-200 text-[15px] font-medium ';

        if (answerState === 'idle') {
            if (selectedAnswer === index) {
                return base + 'border-[#C8B89A] bg-[#F0E8D8] text-[#1C1C1E]';
            }
            return base + 'border-[#E5DDD0] bg-white text-[#3A3A3C] hover:border-[#C8B89A] hover:bg-[#FAF7F2]';
        }

        // Après validation
        if (index === correctAnswerIndex && answerState === 'incorrect') {
            return base + 'border-emerald-400 bg-emerald-50 text-emerald-800';
        }
        if (index === selectedAnswer && answerState === 'correct') {
            return base + 'border-emerald-400 bg-emerald-50 text-emerald-800';
        }
        if (index === selectedAnswer && answerState === 'incorrect') {
            return base + 'border-red-400 bg-red-50 text-red-800';
        }
        return base + 'border-[#E5DDD0] bg-white text-[#3A3A3C] opacity-50';
    };

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{
                background: 'rgba(28, 28, 30, 0.55)',
                backdropFilter: 'blur(4px)',
                opacity: isExiting ? 0 : isVisible ? 1 : 0,
                transition: 'opacity 0.28s ease',
                pointerEvents: isExiting ? 'none' : 'auto',
            }}
        >
            <div
                style={{
                    transform: isVisible && !isExiting ? 'translateY(0)' : 'translateY(18px)',
                    transition: 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className="w-full max-w-md mx-4"
            >
                <div
                    className="rounded-2xl shadow-2xl overflow-hidden"
                    style={{ background: 'rgba(250, 247, 242, 0.97)', border: '1px solid #E5DDD0' }}
                >
                    {/* Header — progress dots */}
                    <div className="px-6 pt-5 pb-0 flex items-center gap-2">
                        {questions.map((_, i) => (
                            <div
                                key={i}
                                className="rounded-full transition-all duration-300"
                                style={{
                                    width: i === currentIndex ? 20 : 6,
                                    height: 6,
                                    background: i < currentIndex ? '#22C55E' : i === currentIndex ? '#A0896C' : '#DDD5C8',
                                }}
                            />
                        ))}
                        {questions.length > 1 && (
                            <span className="ml-auto text-xs text-[#9C8878] font-medium">
                                {currentIndex + 1} / {questions.length}
                            </span>
                        )}
                    </div>

                    {/* Question */}
                    <div className="px-6 py-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-white border border-[#E5DDD0] flex items-center justify-center text-lg">
                                    {avatar}
                                </div>
                                <div className="text-xs text-[#9C8878] font-semibold">Coach Quiz</div>
                            </div>
                            {timeLeft !== null && answerState === 'idle' && (
                                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${timeLeft <= 5 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {timeLeft}s
                                </div>
                            )}
                        </div>
                        <p
                            className="text-[17px] font-semibold leading-snug mb-5"
                            style={{ color: '#1C1C1E' }}
                        >
                            {currentQuestion.question}
                        </p>

                        {/* Réponses */}
                        <div className="space-y-2.5 mb-5">
                            {currentQuestion.answers.map((answer, idx) => (
                                <button
                                    key={answer.id || idx}
                                    onClick={() => handleSelectAnswer(idx)}
                                    disabled={answerState !== 'idle'}
                                    className={getAnswerClass(idx)}
                                >
                                    <span className="flex items-center gap-3">
                                        {/* Indicateur de statut après validation */}
                                        {answerState !== 'idle' && idx === selectedAnswer && answerState === 'correct' && (
                                            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                        )}
                                        {answerState !== 'idle' && idx === selectedAnswer && answerState === 'incorrect' && (
                                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                        )}
                                        {answerState !== 'idle' && idx === correctAnswerIndex && answerState === 'incorrect' && (
                                            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                        )}
                                        {answer.answer}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Feedback */}
                        {answerState === 'correct' && (
                            <div
                                className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-4 text-sm font-medium"
                                style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}
                            >
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span>Bonne réponse ! Continuez comme ça.</span>
                            </div>
                        )}
                        {answerState === 'incorrect' && (
                            <div
                                className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-4 text-sm"
                                style={{ background: '#FFF5F5', border: '1px solid #FED7D7', color: '#C53030' }}
                            >
                                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-medium">{isTimeout ? 'Temps écoulé.' : 'Pas tout à fait.'}</span>
                                    {correctAnswerIndex !== null && (
                                        <span className="block text-[13px] mt-0.5 text-[#744210]">
                                            La bonne réponse était :{' '}
                                            <strong>{currentQuestion.answers[correctAnswerIndex]?.answer}</strong>
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        {answerState === 'idle' ? (
                            <button
                                onClick={handleValidate}
                                disabled={selectedAnswer === null}
                                className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                                style={{
                                    background: selectedAnswer !== null ? '#A0896C' : '#E5DDD0',
                                    color: selectedAnswer !== null ? '#FFFFFF' : '#B0A090',
                                    cursor: selectedAnswer !== null ? 'pointer' : 'not-allowed',
                                }}
                            >
                                Valider
                            </button>
                        ) : (
                            <button
                                onClick={handleContinue}
                                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group"
                                style={{ color: '#9C8878' }}
                            >
                                <span>Continuer</span>
                                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MidVideoQuizOverlay;
