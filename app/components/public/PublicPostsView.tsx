import React from 'react';
import type { Tenant } from '../../types';
import { getPostsForTenant } from '../../seed-data';
import PostCard from '../tenant/PostCard';

interface PublicPostsViewProps {
  tenant: Tenant;
}

const PublicPostsView: React.FC<PublicPostsViewProps> = ({ tenant }) => {
  const posts = getPostsForTenant(tenant.id);

  return (
    <div className="space-y-6">
      {posts.length > 0 ? (
        posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Posts Yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no public posts here at this time.
          </p>
        </div>
      )}
    </div>
  );
};

export default PublicPostsView;
