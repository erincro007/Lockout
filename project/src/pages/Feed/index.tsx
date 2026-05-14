import { useState, useEffect, useCallback } from 'react';
import { Image, Send } from 'lucide-react';
import { PageHeader } from '../../components/layout/AppShell';
import { Avatar } from '../../components/ui/Avatar';
import { Sheet } from '../../components/ui/Sheet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { relativeTime } from '../../lib/dates';
import { useToast } from '../../components/ui/Toast';
import type { Post, Profile, Reaction, Comment } from '../../lib/database.types';

interface PostWithMeta extends Post {
  author: Profile;
  reactions: Reaction[];
  comments: Comment[];
  comment_authors?: Record<string, Profile>;
}

const REACTION_OPTIONS = ['🔥', '💪', '👏', '💛', '😂'];

export default function Feed() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [group, setGroup] = useState<{ id: string; name: string; invite_code: string } | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!profile?.group_id) return;

    const { data: g } = await supabase.from('groups').select('*').eq('id', profile.group_id).maybeSingle();
    setGroup(g);

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('group_id', profile.group_id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!postsData) return;

    const authorIds = [...new Set(postsData.map(p => p.author_id))];
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', authorIds);
    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

    const { data: reactionsData } = await supabase
      .from('reactions')
      .select('*')
      .in('post_id', postsData.map(p => p.id));

    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .in('post_id', postsData.map(p => p.id))
      .order('created_at');

    const commentAuthorIds = [...new Set((commentsData ?? []).map(c => c.author_id))];
    const { data: commentAuthors } = await supabase.from('profiles').select('*').in('id', commentAuthorIds);
    const commentAuthorMap = Object.fromEntries((commentAuthors ?? []).map(p => [p.id, p]));

    setPosts(postsData.map(p => ({
      ...p,
      author: profileMap[p.author_id] ?? { id: p.author_id, name: 'Unknown' } as Profile,
      reactions: (reactionsData ?? []).filter(r => r.post_id === p.id),
      comments: (commentsData ?? []).filter(c => c.post_id === p.id),
      comment_authors: commentAuthorMap,
    })));
  }, [profile?.group_id]);

  useEffect(() => { load(); }, [load]);

  async function handleReact(postId: string, emoji: string) {
    if (!user) return;
    const existing = posts.find(p => p.id === postId)?.reactions.find(
      r => r.user_id === user.id && r.emoji === emoji
    );
    if (existing) {
      await supabase.from('reactions').delete().eq('post_id', postId).eq('user_id', user.id).eq('emoji', emoji);
    } else {
      await supabase.from('reactions').insert({ post_id: postId, user_id: user.id, emoji });
    }
    await load();
  }

  async function handleAddReaction(postId: string) {
    // Show reaction picker (simplified: use first available)
    await handleReact(postId, '🔥');
  }

  function toggleComments(postId: string) {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  async function handleComment(postId: string, body: string) {
    if (!user || !body.trim()) return;
    await supabase.from('comments').insert({ post_id: postId, author_id: user.id, body });
    await load();
  }

  async function copyInvite() {
    if (!group) return;
    await navigator.clipboard.writeText(group.invite_code).catch(() => {});
    toast('Invite code copied!');
  }

  if (!profile?.group_id) {
    return (
      <div className="page-enter">
        <PageHeader eyebrow="Feed" title="No group yet" />
        <div className="px-5">
          <div className="bg-bg border border-border rounded-2xl p-6 text-center space-y-3">
            <p className="text-sm text-ink-secondary">You're not in a group yet.</p>
            <p className="text-xs text-ink-tertiary">Create or join a group from Settings to see the feed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Feed"
        title={group?.name ?? 'Group'}
        right={
          <button
            onClick={copyInvite}
            className="rounded-full px-3.5 py-2 text-xs font-semibold border border-border bg-surface hover:bg-divider transition-colors"
          >
            Invite
          </button>
        }
      />

      <div className="px-5 pb-6 space-y-4 stagger-children">
        {/* Composer */}
        <button
          onClick={() => setComposeOpen(true)}
          className="bg-bg border border-border rounded-2xl p-4 flex items-center gap-3 w-full text-left hover:bg-surface transition-colors"
        >
          <Avatar name={profile.name || 'Me'} size={40} avatarUrl={profile.avatar_url} />
          <span className="text-sm text-ink-secondary flex-1">Share an update, a photo, a brag...</span>
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xl font-light flex-shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            +
          </span>
        </button>

        {posts.length === 0 && (
          <p className="text-sm text-ink-tertiary text-center py-8">be the first to post.</p>
        )}

        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.id ?? ''}
            expanded={expandedComments.has(post.id)}
            onReact={(emoji) => handleReact(post.id, emoji)}
            onToggleComments={() => toggleComments(post.id)}
            onAddComment={(body) => handleComment(post.id, body)}
          />
        ))}
      </div>

      <ComposeSheet
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        profile={profile}
        onPost={async (body, tag, photoUrl) => {
          if (!profile.group_id) return;
          await supabase.from('posts').insert({
            group_id: profile.group_id,
            author_id: profile.id,
            type: 'manual',
            body,
            tag: tag || null,
            photo_url: photoUrl || null,
          });
          setComposeOpen(false);
          await load();
        }}
      />
    </div>
  );
}

interface PostCardProps {
  post: PostWithMeta;
  currentUserId: string;
  expanded: boolean;
  onReact: (emoji: string) => void;
  onToggleComments: () => void;
  onAddComment: (body: string) => void;
}

function PostCard({ post, currentUserId, expanded, onReact, onToggleComments, onAddComment }: PostCardProps) {
  const [commentInput, setCommentInput] = useState('');
  const isAuto = post.type !== 'manual';

  const reactionGroups = REACTION_OPTIONS.reduce<Record<string, { count: number; myReaction: boolean }>>((acc, emoji) => {
    const reactions = post.reactions.filter(r => r.emoji === emoji);
    if (reactions.length > 0) {
      acc[emoji] = {
        count: reactions.length,
        myReaction: reactions.some(r => r.user_id === currentUserId),
      };
    }
    return acc;
  }, {});

  return (
    <div className="bg-bg border border-border rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={post.author.name || 'User'} size={40} avatarUrl={post.author.avatar_url} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{post.author.name || 'Unknown'}</p>
          <div className="flex items-center gap-1.5 text-xs text-ink-tertiary">
            <span>{relativeTime(post.created_at)}</span>
            {isAuto && (
              <>
                <span className="opacity-40">·</span>
                <span className="bg-surface border border-border rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">auto</span>
              </>
            )}
            {!isAuto && post.tag && (
              <>
                <span className="opacity-40">·</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                >
                  {post.tag}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm leading-relaxed mb-3">{post.body}</p>

      {/* Photo */}
      {post.photo_url && (
        <img
          src={post.photo_url}
          alt=""
          className="w-full rounded-xl aspect-video object-cover mb-3"
        />
      )}

      {/* Reactions */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(reactionGroups).map(([emoji, { count, myReaction }]) => (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors tap-active"
            style={myReaction
              ? { background: 'var(--accent-muted)', borderColor: 'var(--accent-muted)', color: 'var(--accent)' }
              : { background: '#FAFAFA', borderColor: '#E5E5EA', color: '#6E6E73' }
            }
          >
            <span className="text-sm">{emoji}</span>
            <span className="tabular-nums">{count}</span>
          </button>
        ))}
        <button
          onClick={() => onReact('🔥')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-base text-ink-tertiary hover:bg-surface transition-colors"
        >
          +
        </button>
        <div className="flex-1" />
        <button
          onClick={onToggleComments}
          className="flex items-center gap-1.5 text-xs text-ink-secondary font-semibold px-2 py-1 rounded-full hover:bg-surface transition-colors"
        >
          <Send size={13} />
          <span className="tabular-nums">{post.comments.length}</span>
        </button>
      </div>

      {/* Comments */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-divider space-y-3">
          {post.comments.map(c => {
            const author = (post.comment_authors ?? {})[c.author_id];
            return (
              <div key={c.id} className="flex gap-2">
                <Avatar name={author?.name ?? 'U'} size={28} avatarUrl={author?.avatar_url} />
                <div className="flex-1 bg-surface rounded-xl px-3 py-2">
                  <p className="text-xs font-semibold">{author?.name ?? 'Unknown'}</p>
                  <p className="text-sm mt-0.5">{c.body}</p>
                </div>
              </div>
            );
          })}
          <div className="flex gap-2 pt-1">
            <input
              className="flex-1 bg-surface rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Add a comment..."
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { onAddComment(commentInput); setCommentInput(''); } }}
            />
            <button
              onClick={() => { onAddComment(commentInput); setCommentInput(''); }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ComposeSheetProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  onPost: (body: string, tag: string, photoUrl: string) => Promise<void>;
}

function ComposeSheet({ open, onClose, profile, onPost }: ComposeSheetProps) {
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('');
  const [posting, setPosting] = useState(false);
  const TAGS = ['workout', 'food', 'progress', 'mindset', 'rest'];

  async function handlePost() {
    if (!body.trim()) return;
    setPosting(true);
    await onPost(body, tag, '');
    setBody('');
    setTag('');
    setPosting(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="New post">
      <div className="space-y-4">
        <div className="flex gap-3">
          <Avatar name={profile.name || 'Me'} size={36} avatarUrl={profile.avatar_url} />
          <textarea
            className="flex-1 bg-surface rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 resize-none"
            placeholder="what's on your mind?"
            rows={4}
            value={body}
            onChange={e => setBody(e.target.value)}
            autoFocus
            style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">Tag</p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(t => (
              <button
                key={t}
                onClick={() => setTag(tag === t ? '' : t)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                style={tag === t
                  ? { background: 'var(--accent-muted)', borderColor: 'var(--accent-muted)', color: 'var(--accent)' }
                  : { borderColor: '#E5E5EA', color: '#6E6E73', background: '#FAFAFA' }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold text-ink-secondary hover:bg-divider transition-colors">
            <Image size={16} />
            Photo
          </button>
          <button
            onClick={handlePost}
            disabled={!body.trim() || posting}
            className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white tap-active disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
