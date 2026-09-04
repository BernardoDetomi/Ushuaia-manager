import React, { useState } from 'react';
import GroupList from './GroupList';
import GroupDetail from './GroupDetail';

const SplitMain = ({ user, groups }) => {
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup}
        user={user}
        onBack={() => setSelectedGroupId(null)}
      />
    );
  }

  return <GroupList groups={groups} user={user} onSelectGroup={setSelectedGroupId} />;
};

export default SplitMain;
