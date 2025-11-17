import React, { useState } from 'react';
import type { ContactSubmission } from '../../../types';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';

interface RespondSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (responseText: string) => void;
  submission: ContactSubmission;
}

const RespondSubmissionModal: React.FC<RespondSubmissionModalProps> = ({ isOpen, onClose, onSubmit, submission }) => {
  const [responseText, setResponseText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) {
      alert('Please enter a response.');
      return;
    }
    onSubmit(responseText);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Respond to ${submission.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
            <p className="text-sm text-gray-500">Replying to: <span className="font-medium text-gray-800">{submission.email}</span></p>
            <blockquote className="mt-2 border-l-4 border-gray-200 pl-4 text-sm text-gray-600 italic">
                {submission.message}
            </blockquote>
        </div>
        <div>
          <label htmlFor="responseText" className="block text-sm font-medium text-gray-700 mb-1">
            Your Response
          </label>
          <textarea
            id="responseText"
            name="responseText"
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Send Response
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RespondSubmissionModal;
