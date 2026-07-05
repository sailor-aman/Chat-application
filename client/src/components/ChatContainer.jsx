import React, { useContext, useRef, useState, useEffect } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/chatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const ChatContainer = () => {
    const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, deleteChat, users, deleteMessage } = useContext(ChatContext);
    const { authUser, onlineUsers } = useContext(AuthContext);

    const scrollEnd = useRef();
    const [input, setInput] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedMessageToShare, setSelectedMessageToShare] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedMessageToDelete, setSelectedMessageToDelete] = useState(null);

    // Handle sending text messages
    const handleSendMessages = async (e) => {
        e.preventDefault();
        if (input.trim() === "") return;
        await sendMessage({ text: input.trim() });
        setInput("");
    }

    // Handle sending images
    const handleSendImage = async (e) => {
        const file = e.target.files[0];

        if (!file || !file.type.startsWith("image/")) {
            toast.error("Select an image file");
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            await sendMessage({ image: reader.result });
            e.target.value = ""; // Clear file selector
        };
        reader.readAsDataURL(file);
    }

    // Handle sending documents
    const handleSendDocument = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedExtensions = /(\.pdf|\.doc|\.docx|\.txt|\.xls|\.xlsx|\.ppt|\.pptx|\.csv)$/i;
        if (!allowedExtensions.exec(file.name)) {
            toast.error("Unsupported file type. Please select a document.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            await sendMessage({ file: reader.result, fileName: file.name });
            e.target.value = ""; // Clear file selector
        };
        reader.readAsDataURL(file);
    }

    // Handle deleting the entire conversation
    const handleDeleteChat = async () => {
        if (window.confirm("Are you sure you want to delete this conversation? This cannot be undone.")) {
            await deleteChat(selectedUser._id);
        }
    }

    // Open the forwarding modal
    const handleOpenShareModal = (msg) => {
        setSelectedMessageToShare(msg);
        setShowShareModal(true);
    }

    // Forward the message to a selected user
    const handleForwardMessage = async (targetUser) => {
        if (!selectedMessageToShare) return;
        try {
            const payload = {};
            if (selectedMessageToShare.text) payload.text = selectedMessageToShare.text;
            if (selectedMessageToShare.image) payload.image = selectedMessageToShare.image;
            if (selectedMessageToShare.file) {
                payload.file = selectedMessageToShare.file;
                payload.fileName = selectedMessageToShare.fileName;
            }

            const { data } = await axios.post(`/api/messages/send/${targetUser._id}`, payload);
            if (data.success) {
                toast.success(`Message forwarded to ${targetUser.fullName}`);
                if (selectedUser && selectedUser._id === targetUser._id) {
                    getMessages(selectedUser._id);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setShowShareModal(false);
            setSelectedMessageToShare(null);
        }
    }

    // Open delete options modal for a specific message
    const handleOpenDeleteModal = (msg) => {
        setSelectedMessageToDelete(msg);
        setShowDeleteModal(true);
    }

    // Confirm individual message deletion
    const handleConfirmDelete = async (deleteType) => {
        if (!selectedMessageToDelete) return;
        await deleteMessage(selectedMessageToDelete._id, deleteType);
        setShowDeleteModal(false);
        setSelectedMessageToDelete(null);
    }

    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id);
        }
    }, [selectedUser]);

    useEffect(() => {
        if (scrollEnd.current && messages) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return selectedUser ? (
        <div className='h-full overflow-scroll relative backdrop-blur-lg'>

            {/* ------ Header -------- */}
            <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
                <img src={selectedUser.profilePic || assets.avatar_icon} alt='' className='w-8 rounded-full' />
                <div className='flex-1 text-lg text-white flex items-center gap-2'>
                    <p>{selectedUser.fullName}</p>
                    {onlineUsers.includes(selectedUser._id) &&
                        <span className='w-2 h-2 rounded-full bg-green-400 block animate-pulse'></span>
                    }
                </div>
                {/* Close chat / Back button */}
                <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt='' className='md:hidden max-w-7 cursor-pointer' />
                <img src={assets.help_icon} alt='' className='max-md:hidden max-w-5' />
                
                {/* Delete Chat Button */}
                <button onClick={handleDeleteChat} title="Delete Chat" className='text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer ml-3 bg-transparent border-none outline-none'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </button>
            </div>

            {/* ---------- Chat Area ----------- */}
            <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6 '>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`relative group flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}
                    >
                        {/* Action buttons (Share / Delete), visible on hover */}
                        <div className='opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 self-center mx-1'>
                            <button
                                onClick={() => handleOpenShareModal(msg)}
                                title="Forward Message"
                                className='bg-slate-800/80 hover:bg-slate-700 text-white rounded-full p-1 cursor-pointer border border-gray-600'
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleOpenDeleteModal(msg)}
                                title="Delete Message"
                                className='bg-slate-800/80 hover:bg-red-900/50 hover:text-red-400 text-white rounded-full p-1 cursor-pointer border border-gray-600'
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </button>
                        </div>

                        {/* Chat Media/Bubble Layout Render Blocks */}
                        {msg.image ? (
                            <img src={msg.image} alt='' className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' />
                        ) : msg.file ? (
                            <div className={`p-3 max-w-[230px] md:text-sm font-light rounded-lg mb-8 bg-[#282142]/80 border border-gray-700 text-white flex flex-col gap-2`}>
                                <div className='flex items-center gap-2'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-violet-400 flex-shrink-0">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                    <span className='truncate text-xs font-medium' title={msg.fileName}>{msg.fileName || "Document"}</span>
                                </div>
                                <a href={msg.file} target="_blank" rel="noopener noreferrer" download={msg.fileName} className='text-xs text-right font-semibold text-violet-400 hover:text-violet-300 underline transition-colors self-end'>
                                    Download
                                </a>
                            </div>
                        ) : (
                            <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white
                                ${msg.senderId === authUser._id ? ' rounded-br-none' : ' rounded-bl-none'}`}>
                                {msg.text}
                            </p>
                        )}

                        {/* Profile Avatar & Timestamp & Double Checkmarks */}
                        <div className='text-center text-xs flex flex-col items-center gap-1 mb-8'>
                            <img
                                src={msg.senderId === authUser._id ? authUser.profilePic || assets.avatar_icon : selectedUser.profilePic || assets.avatar_icon}
                                alt=''
                                className='w-7 rounded-full'
                            />
                            <p className='text-gray-500'>{formatMessageTime(msg.createdAt)}</p>
                            {/* WhatsApp style double checkmark */}
                            {msg.senderId === authUser._id && (
                                <span className={msg.seen ? 'text-sky-400' : 'text-neutral-500'} title={msg.seen ? 'Read' : 'Delivered'}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                        <path d="M2 12l5 5L18 5" />
                                        <path d="M8 12l5 5L22 5" />
                                    </svg>
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={scrollEnd}></div>
            </div>

            {/* ------- Bottom Input Controller Area --------- */}
            <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-transparent'>
                <form onSubmit={handleSendMessages} className='flex-1 flex items-center bg-[#282142]/60 border border-gray-700 px-3 rounded-full'>
                    <input
                        onChange={(e) => setInput(e.target.value)}
                        value={input}
                        type="text"
                        placeholder='Send a message...'
                        className='flex-1 text-sm p-3 bg-transparent border-none outline-none text-white placeholder-gray-400'
                    />
                    
                    {/* Image Attachment Input */}
                    <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
                    <label htmlFor="image" title="Upload Image">
                        <img src={assets.gallery_icon} alt='Upload Image' className='w-5 mr-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity' />
                    </label>

                    {/* Document Attachment Input */}
                    <input onChange={handleSendDocument} type="file" id='document-file' accept='.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx' hidden />
                    <label htmlFor="document-file" title="Upload Document">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-400 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                    </label>
                </form>
                <img onClick={handleSendMessages} src={assets.send_button} alt='Send' className='w-7 cursor-pointer' />
            </div>

            {/* ------ Share/Forward Modal ------ */}
            {showShareModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
                    <div className='bg-[#282142] border border-gray-700 w-full max-w-sm rounded-xl p-5 text-white flex flex-col max-h-[80vh] shadow-2xl animate-in fade-in zoom-in-95 duration-150'>
                        <div className='flex justify-between items-center pb-3 border-b border-gray-700 mb-4'>
                            <h3 className='text-lg font-semibold text-white'>Forward Message</h3>
                            <button onClick={() => setShowShareModal(false)} className='text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none outline-none'>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <p className='text-xs text-gray-400 mb-3'>Select a user to forward this message:</p>
                        
                        <div className='flex-1 overflow-y-auto flex flex-col gap-2 pr-1'>
                            {users.length === 0 ? (
                                <p className='text-sm text-gray-500 text-center py-4'>No other users available</p>
                            ) : (
                                users.map((user) => (
                                    <div 
                                        key={user._id}
                                        onClick={() => handleForwardMessage(user)}
                                        className='flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/40 hover:bg-violet-600/30 border border-gray-800 hover:border-violet-500/50 cursor-pointer transition-all duration-100 text-left'
                                    >
                                        <img src={user.profilePic || assets.avatar_icon} alt='' className='w-9 h-9 rounded-full object-cover' />
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-sm font-medium truncate text-white'>{user.fullName}</p>
                                            <p className='text-xs text-gray-400 truncate'>{user.email}</p>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-violet-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                        </svg>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ------ Delete Message Modal (WhatsApp style) ------ */}
            {showDeleteModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
                    <div className='bg-[#282142] border border-gray-700 w-full max-w-sm rounded-xl p-5 text-white flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150'>
                        <h3 className='text-lg font-semibold mb-2 text-white'>Delete message?</h3>
                        <p className='text-sm text-gray-400 mb-5'>Are you sure you want to delete this message?</p>
                        
                        <div className='flex flex-col gap-2'>
                            {selectedMessageToDelete?.senderId === authUser._id && (
                                <button 
                                    onClick={() => handleConfirmDelete("everyone")}
                                    className='w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-sm font-semibold cursor-pointer border-none text-white'
                                >
                                    Delete for Everyone
                                </button>
                            )}
                            <button 
                                onClick={() => handleConfirmDelete("me")}
                                className='w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-semibold cursor-pointer border-none text-white'
                            >
                                Delete for Me
                            </button>
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className='w-full py-2.5 rounded-lg bg-transparent hover:bg-slate-800 transition-colors text-sm font-semibold cursor-pointer border border-gray-600 text-gray-300'
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    ) : (
        /* Empty State */
        <div className='flex flex-col items-center justify-center h-full gap-2 text-gray-500 bg-white/5 max-md:hidden w-full'>
            <img src={assets.logo_icon} className='max-w-16 opacity-40' alt='' />
            <p className='text-lg font-medium text-white/60'>Chat AnyTime, anywhere</p>
        </div>
    )
}

export default ChatContainer;