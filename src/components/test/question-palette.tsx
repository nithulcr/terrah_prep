'use client';

import { useState } from 'react';
import { Button, Card, CardBody } from '@/components/ui';
import { X, CheckCircle, Flag, Circle } from 'lucide-react';
import { Question } from '@/types';

interface QuestionPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  answeredQuestions: Set<number>;
  flaggedQuestions: number[];
  selectedAnswers: Record<number, string>;
}

export default function QuestionPalette({
  isOpen,
  onClose,
  questions,
  currentIndex,
  onNavigate,
  answeredQuestions,
  flaggedQuestions,
  selectedAnswers,
}: QuestionPaletteProps) {
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered' | 'flagged'>('all');

  if (!isOpen) return null;

  const getQuestionStatus = (questionId: number, index: number) => {
    if (index === currentIndex) return 'current';
    if (answeredQuestions.has(questionId)) return 'answered';
    if (flaggedQuestions.includes(questionId)) return 'flagged';
    return 'unanswered';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return 'border-blue-500 bg-blue-50';
      case 'answered':
        return 'border-green-500 bg-green-50';
      case 'flagged':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-slate-200 bg-white hover:border-blue-300';
    }
  };

  const getStatusIcon = (status: string, questionId: number) => {
    switch (status) {
      case 'current':
        return <Circle className="h-4 w-4 text-blue-600 fill-current" />;
      case 'answered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'flagged':
        return <Flag className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-slate-400" />;
    }
  };

  const filteredQuestions = questions.filter((q, idx) => {
    const status = getQuestionStatus(q.id, idx);
    switch (filter) {
      case 'answered':
        return status === 'answered' || status === 'current';
      case 'unanswered':
        return status === 'unanswered' || status === 'current';
      case 'flagged':
        return status === 'flagged' || status === 'current';
      default:
        return true;
    }
  });

  const stats = {
    total: questions.length,
    answered: answeredQuestions.size,
    unanswered: questions.length - answeredQuestions.size,
    flagged: flaggedQuestions.length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardBody className="p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Question Palette</h2>
              <p className="text-sm text-slate-600 mt-1">
                Click on a question to navigate. Status indicators show your progress.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Statistics */}
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border border-slate-200">
              <CardBody className="p-3 text-center">
                <p className="text-xs text-slate-600">Total</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              </CardBody>
            </Card>
            <Card className="border border-green-200 bg-green-50">
              <CardBody className="p-3 text-center">
                <p className="text-xs text-green-700">Answered</p>
                <p className="text-xl font-bold text-green-600">{stats.answered}</p>
              </CardBody>
            </Card>
            <Card className="border border-red-200 bg-red-50">
              <CardBody className="p-3 text-center">
                <p className="text-xs text-red-700">Flagged</p>
                <p className="text-xl font-bold text-red-600">{stats.flagged}</p>
              </CardBody>
            </Card>
            <Card className="border border-yellow-200 bg-yellow-50">
              <CardBody className="p-3 text-center">
                <p className="text-xs text-yellow-700">Unanswered</p>
                <p className="text-xl font-bold text-yellow-600">{stats.unanswered}</p>
              </CardBody>
            </Card>
          </div>

          {/* Filter Buttons */}
          <div className="mb-4 flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={filter === 'answered' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('answered')}
            >
              Answered ({stats.answered})
            </Button>
            <Button
              variant={filter === 'unanswered' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('unanswered')}
            >
              Unanswered ({stats.unanswered})
            </Button>
            <Button
              variant={filter === 'flagged' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('flagged')}
            >
              Flagged ({stats.flagged})
            </Button>
          </div>

          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border-2 border-blue-500 bg-blue-50"></div>
              <span className="text-slate-600">Current Question</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border-2 border-green-500 bg-green-50"></div>
              <span className="text-slate-600">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border-2 border-red-500 bg-red-50"></div>
              <span className="text-slate-600">Flagged for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border-2 border-slate-200 bg-white"></div>
              <span className="text-slate-600">Unanswered</span>
            </div>
          </div>

          {/* Question Grid */}
          <div className="flex flex-wrap gap-2">
            {filteredQuestions.map((question, idx) => {
              const originalIndex = questions.findIndex(q => q.id === question.id);
              const status = getQuestionStatus(question.id, originalIndex);
              const hasAnswer = selectedAnswers[question.id];

              return (
                <button
                  key={question.id}
                  onClick={() => {
                    onNavigate(originalIndex);
                    onClose();
                  }}
                  className={`relative flex items-center justify-center rounded border-2 p-2 transition-all hover:scale-105 ${getStatusColor(status)}`}
                  title={`Q${originalIndex + 1}: ${status}${hasAnswer ? ' (Answered)' : ''}`}
                >
                  <span className="text-sm font-semibold">{originalIndex + 1}</span>
                  <div className="absolute -top-1 -right-1 opacity-0">
                    {getStatusIcon(status, question.id)}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="mt-8 text-center">
              <p className="text-slate-600">No questions match the selected filter</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}