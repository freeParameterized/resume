import type { Profile } from "../types";

export function Summary({ profile }: { profile: Profile }) {
  return (
    <>
      <p className="lede">{profile.summary}</p>
      <div className="contact-row">
        <span>{profile.location}</span>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        {profile.website ? (
          <a href={profile.website} target="_blank" rel="noreferrer">
            {profile.company}
          </a>
        ) : null}
      </div>
    </>
  );
}
