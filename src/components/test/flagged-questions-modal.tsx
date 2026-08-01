'use client';

import { useState } from 'react';
import { Button, Card, CardBody } from '@/components/ui';
import { ChevronLeft, ChevronRight, X, Flag } from 'lucide-react';
import { Question } from '@/types';

interface FlaggedQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  flaggedIds: number[];
  questions: Question[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onAnswerSelect?: (questionId: number, answer: string | null) => void;
  selectedAnswers?: Record<number, string>;
}

export default function FlaggedQuestionsModal({
  isOpen,
  onClose,
  flaggedIds,
  questions,
  currentIndex,
  onNavigate,
  onAnswerSelect,
  selectedAnswers = {},
}: FlaggedQuestionsModalProps) {
  const [selectedFlagIndex, setSelectedFlagIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<number, string>>({});

  if (!isOpen) return null;

  // Get the flagged questions with their details
  const flaggedQuestions = flaggedIds
    .map(id => questions.find(q => q.id === id))
    .filter((q): q is Question => q !== undefined);

  const currentFlaggedQuestion = flaggedQuestions[selectedFlagIndex];
  const isCurrentlyViewing = currentFlaggedQuestion && questions[currentIndex]?.id === currentFlaggedQuestion.id;

  const handlePrevious = () => {
    if (selectedFlagIndex > 0) {
      const newIndex = selectedFlagIndex - 1;
      setSelectedFlagIndex(newIndex);
      const questionId = flaggedQuestions[newIndex]?.id;
      if (questionId) {
        const questionIndex = questions.findIndex(q => q.id === questionId);
        if (questionIndex !== -1) {
          onNavigate(questionIndex);
        }
      }
    }
  };

  const handleNext = () => {
    if (selectedFlagIndex < flaggedQuestions.length - 1) {
      const newIndex = selectedFlagIndex + 1;
      setSelectedFlagIndex(newIndex);
      const questionId = flaggedQuestions[newIndex]?.id;
      if (questionId) {
        const questionIndex = questions.findIndex(q => q.id === questionId);
        if (questionIndex !== -1) {
          onNavigate(questionIndex);
        }
      }
    }
  };

  const handleJumpToQuestion = (questionId: number) => {
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex !== -1) {
      onNavigate(questionIndex);
      onClose();
    }
  };

  const handleAnswerClick = (questionId: number, optionKey: string) => {
    const newAnswers = { ...localAnswers, [questionId]: optionKey };
    setLocalAnswers(newAnswers);
    
    if (onAnswerSelect) {
      onAnswerSelect(questionId, optionKey);
    }
  };

  const getCurrentAnswer = (questionId: number) => {
    return localAnswers[questionId] || selectedAnswers[questionId] || null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardBody className="p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Flagged Questions</h2>
              <p className="text-sm text-slate-600 mt-1">
                {flaggedQuestions.length} question{flaggedQuestions.length !== 1 ? 's' : ''} flagged - Review and answer them
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {flaggedQuestions.length === 0 ? (
            <div className="text-center py-8">
              <Flag className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <p className="text-slate-600">No flagged questions</p>
            </div>
          ) : (
            <>
              {/* Current Flagged Question */}
              {currentFlaggedQuestion && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-slate-600">
                      Question {selectedFlagIndex + 1} of {flaggedQuestions.length}
                    </span>
                    {isCurrentlyViewing && (
                      <span className="text-xs text-green-600 font-medium">(Currently viewing)</span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {currentFlaggedQuestion.question}
                  </h3>

                  {/* Answer Options - No correct answer shown during test */}
                  <div className="space-y-2">
                    {['A', 'B', 'C', 'D'].map((option) => {
                      const optionText = currentFlaggedQuestion[`option_${option.toLowerCase()}` as keyof Question] as string;
                      const isSelected = getCurrentAnswer(currentFlaggedQuestion.id) === option;

                      return (
                        <button
                          key={option}
                          onClick={() => handleAnswerClick(currentFlaggedQuestion.id, option)}
                          className={`w-full rounded border p-3 text-left transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <span className="font-semibold">{option}.</span> {optionText}
                          {isSelected && <span className="ml-2 text-blue-600">● Selected</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation hidden during test - shown only in results */}
                  {/* {currentFlaggedQuestion.explanation && (
                    <div className="mt-3 rounded-lg bg-blue-50 p-3">
                      <p className="text-sm font-semibold text-blue-900">Explanation:</p>
                      <p className="text-sm text-blue-800">{currentFlaggedQuestion.explanation}</p>
                    </div>
                  )} */}

                  {/* Navigation Buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={selectedFlagIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      disabled={selectedFlagIndex === flaggedQuestions.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    {!isCurrentlyViewing && (
                      <Button
                        size="sm"
                        onClick={() => handleJumpToQuestion(currentFlaggedQuestion.id)}
                      >
                        Go to Question
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* All Flagged Questions List */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">All Flagged Questions</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {flaggedQuestions.map((q, idx) => {
                    const questionIndex = questions.findIndex(question => question.id === q.id);
                    const isCurrent = questionIndex === currentIndex;
                    const hasAnswer = getCurrentAnswer(q.id);
                    
                    return (
                      <div
                        key={q.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          idx === selectedFlagIndex
                            ? 'border-blue-500 bg-blue-50'
                            : isCurrent
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                        onClick={() => {
                          // Just navigate to this flagged question within the modal
                          setSelectedFlagIndex(idx);
                          const questionId = flaggedQuestions[idx]?.id;
                          if (questionId) {
                            const questionIndex = questions.findIndex(qq => qq.id === questionId);
                            if (questionIndex !== -1) {
                              onNavigate(questionIndex);
                            }
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-slate-600">
                                Q{questionIndex + 1}
                              </span>
                              {isCurrent && (
                                <span className="text-xs text-green-600 font-medium">Current</span>
                              )}
                              {hasAnswer && (
                                <span className="text-xs text-blue-600 font-medium">● Answered</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-900 line-clamp-2">{q.question}</p>
                          </div>
                          <Flag className="h-4 w-4 text-red-600 flex-shrink-0 ml-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
