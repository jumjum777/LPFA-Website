'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StaffMember } from '@/lib/types';

interface StaffPageProps {
  members: StaffMember[];
}

export default function StaffPage({ members }: StaffPageProps) {
  const [activeMember, setActiveMember] = useState<StaffMember | null>(null);

  const openBio = useCallback((member: StaffMember) => {
    if (!member.bio) return;
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

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="team-grid">
            {members.map((member, i) => (
              <div
                key={member.id}
                className={`team-card${member.bio ? '' : ' no-bio'}`}
                data-animate="fade-up"
                data-delay={String((i % 4) * 100)}
                onClick={() => openBio(member)}
                style={member.bio ? undefined : { cursor: 'default' }}
              >
                {member.photo_url && (
                  <img src={member.photo_url} alt={member.name} className="team-photo" />
                )}
                <div className="team-card-body">
                  <h4>{member.name}</h4>
                  <span className="team-title">{member.title}</span>
                  {(member.phone || member.email) && (
                    <div className="team-contact">
                      {member.phone && (
                        <a href={`tel:${member.phone.replace(/[^0-9]/g, '').slice(0, 10)}`} onClick={e => e.stopPropagation()}>
                          <i className="fas fa-phone-alt"></i> {member.phone}
                        </a>
                      )}
                      {member.email && (
                        <a href={`mailto:${member.email}`} onClick={e => e.stopPropagation()}>
                          <i className="fas fa-envelope"></i> {member.email}
                        </a>
                      )}
                    </div>
                  )}
                  {member.bio && (
                    <span className="team-card-cta">View Bio <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem', marginLeft: '0.3rem' }}></i></span>
                  )}
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
              <span className="team-title" style={{ marginBottom: 0 }}>{activeMember?.title}</span>
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
