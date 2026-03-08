'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BoardMember } from '@/lib/types';

interface BoardPageProps {
  members: BoardMember[];
}

export default function BoardPage({ members }: BoardPageProps) {
  const [activeMember, setActiveMember] = useState<BoardMember | null>(null);

  const openBio = useCallback((member: BoardMember) => {
    setActiveMember(member);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeBio = useCallback(() => {
    setActiveMember(null);
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeBio();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeBio]);

  const officers = members.filter(m => m.is_officer);
  const regularMembers = members.filter(m => !m.is_officer);

  return (
    <>
      {/* BOARD */}
      <section className="section">
        <div className="container">

          {/* Officers */}
          {officers.length > 0 && (
            <div className="board-officers" data-animate="fade-up">
              {officers.map(member => (
                <div key={member.id} className="board-card" onClick={() => openBio(member)}>
                  {member.photo_url && (
                    <img src={member.photo_url} alt={member.name} className="board-card-photo" />
                  )}
                  <div className="board-card-body">
                    <h4>{member.name}</h4>
                    <span className="board-card-role">{member.role}</span>
                    <span className="board-card-cta">View Bio <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem', marginLeft: '0.3rem' }}></i></span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Board Members */}
          <div className="board-grid">
            {regularMembers.map((member, i) => (
              <div key={member.id} className="board-card" data-animate="fade-up" data-delay={String((i % 3) * 100)} onClick={() => openBio(member)}>
                {member.photo_url && (
                  <img src={member.photo_url} alt={member.name} className="board-card-photo" />
                )}
                <div className="board-card-body">
                  <h4>{member.name}</h4>
                  <span className="board-card-role">{member.role}</span>
                  {member.term_text && <span className="board-card-term">{member.term_text}</span>}
                  <span className="board-card-cta">View Bio <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem', marginLeft: '0.3rem' }}></i></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BIO MODAL */}
      <div
        className={`bio-modal-overlay${activeMember ? ' active' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) closeBio(); }}
      >
        <div className="bio-modal">
          <div className="bio-modal-header">
            {activeMember?.photo_url && (
              <img src={activeMember.photo_url} alt={activeMember.name} className="bio-modal-photo" />
            )}
            <div>
              <h3>{activeMember?.name}</h3>
              <span className="board-card-role">{activeMember?.role}</span>
            </div>
            <button className="bio-modal-close" onClick={closeBio} aria-label="Close">
              <i className="fas fa-times"></i>
            </button>
          </div>
          {activeMember?.bio && (
            <div
              className="bio-modal-content"
              dangerouslySetInnerHTML={{ __html: activeMember.bio }}
            />
          )}
        </div>
      </div>
    </>
  );
}
