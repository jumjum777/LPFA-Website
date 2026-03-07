'use client';

const facilities = [
  { id: 'black-river-landing', label: 'Black River Landing' },
  { id: 'mile-long-pier', label: 'Mile-Long Pier' },
  { id: 'lakeside-landing', label: 'Lakeside Landing' },
  { id: 'boat-launch', label: 'Boat Launch' },
  { id: 'riverside-park', label: 'Riverside Park' },
];

export default function FacilityJumpNav() {
  return (
    <div className="facility-jump-nav">
      <div className="container">
        {/* Desktop: pill buttons */}
        <div className="facility-jump-nav-inner facility-jump-desktop">
          <span className="facility-jump-label">Jump to:</span>
          {facilities.map(f => (
            <a key={f.id} href={`#${f.id}`} className="facility-jump-link">{f.label}</a>
          ))}
        </div>

        {/* Mobile: dropdown */}
        <div className="facility-jump-mobile">
          <span className="facility-jump-label">Jump to:</span>
          <div className="facility-jump-select-wrap">
            <select
              className="facility-jump-select"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  const el = document.getElementById(e.target.value);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  e.target.value = '';
                }
              }}
            >
              <option value="" disabled>Select a facility...</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
            <i className="fas fa-chevron-down facility-jump-select-icon"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
