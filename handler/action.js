export default async function actionHandler(event, config) {
  const { reaction, message, senderId, client } = event;
  
  try {
    // Check permissions
    const isOwner = config.ownerIds.includes(senderId.toString());
    const isAdmin = config.adminIds.includes(senderId.toString());

    // Handle reactions based on your logic
    console.log(`Reaction ${reaction.emoticon} from ${senderId}`);
    
    // Add your reaction handling logic here
    
  } catch (error) {
    console.error(`Error in action handler:`, error);
  }
}
