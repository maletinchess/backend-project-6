const checkIfStatusConnectedWithTask = async (status) => {
  const statusTasks = await status.$relatedQuery('tasks');
  return statusTasks.length === 0;
};

const checkIfLabelConnectedWithTask = async (label) => {
  const labelTasks = await label.$relatedQuery('tasks');
  return labelTasks.length === 0;
};

const checkIfUserConnectedWithTask = async (user) => {
  const userTasks = await user.$relatedQuery('tasks');
  return userTasks.length === 0;
};
