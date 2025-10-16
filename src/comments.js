import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://fmvglofbpsodvpqpolqk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdmdsb2ZicHNvZHZwcXBvbHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNDQ4NzQsImV4cCI6MjA1MDYyMDg3NH0.2J8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8'
const supabase = createClient(supabaseUrl, supabaseKey)

// DOM elements
const commentName = document.getElementById('commentName')
const commentText = document.getElementById('commentText')
const submitButton = document.getElementById('submitComment')
const commentsList = document.getElementById('commentsList')

// Load comments on page load
document.addEventListener('DOMContentLoaded', loadComments)

// Submit comment
submitButton.addEventListener('click', submitComment)

// Also submit on Enter key in textarea
commentText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submitComment()
  }
})

// Global flag to track if we're in comments mode
window.commentsMode = false

// Disable game keyboard controls when in comments section
function disableGameControls() {
  window.commentsMode = true
  document.body.classList.add('comments-active')
  
  // Also try to disable Phaser keyboard input directly
  if (window.game && window.game.scene && window.game.scene.scenes[0]) {
    const scene = window.game.scene.scenes[0]
    if (scene.input && scene.input.keyboard) {
      scene.input.keyboard.enabled = false
    }
  }
  
  console.log('Comments mode enabled - game controls disabled')
}

function enableGameControls() {
  window.commentsMode = false
  document.body.classList.remove('comments-active')
  
  // Re-enable Phaser keyboard input
  if (window.game && window.game.scene && window.game.scene.scenes[0]) {
    const scene = window.game.scene.scenes[0]
    if (scene.input && scene.input.keyboard) {
      scene.input.keyboard.enabled = true
    }
  }
  
  console.log('Comments mode disabled - game controls enabled')
}

// When clicking in comment fields, disable game controls
commentName.addEventListener('focus', disableGameControls)
commentText.addEventListener('focus', disableGameControls)

// When clicking outside comment fields, re-enable game controls
commentName.addEventListener('blur', enableGameControls)
commentText.addEventListener('blur', enableGameControls)

// Also disable when clicking anywhere in the comments section
const commentsSection = document.querySelector('.comments-section')
if (commentsSection) {
  commentsSection.addEventListener('click', disableGameControls)
}

// Re-enable when clicking in the game area
const gameContainer = document.querySelector('.game-container')
if (gameContainer) {
  gameContainer.addEventListener('click', enableGameControls)
}

// Prevent keyboard events from reaching Phaser when in comments mode
document.addEventListener('keydown', (e) => {
  if (window.commentsMode) {
    // Always allow normal text input behavior in form fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return // Let the input handle it normally - don't block anything
    }
    // Block ALL keyboard events when not in form fields (game controls disabled)
    e.stopPropagation()
    e.preventDefault()
  }
}, true) // Use capture phase to intercept before Phaser

async function loadComments() {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    displayComments(data || [])
  } catch (error) {
    console.error('Error loading comments:', error)
    commentsList.innerHTML = '<p class="loading">Error loading comments. Please try again later.</p>'
  }
}

function displayComments(comments) {
  if (comments.length === 0) {
    commentsList.innerHTML = '<p class="loading">No comments yet. Be the first to share your thoughts!</p>'
    return
  }

  commentsList.innerHTML = comments.map(comment => `
    <div class="comment">
      <div class="comment-author">${escapeHtml(comment.author)}</div>
      <div class="comment-text">${escapeHtml(comment.text)}</div>
      <div class="comment-date">${formatDate(comment.created_at)}</div>
    </div>
  `).join('')
}

async function submitComment() {
  const name = commentName.value.trim()
  const text = commentText.value.trim()

  if (!name || !text) {
    alert('Please fill in both name and comment fields.')
    return
  }

  if (text.length > 500) {
    alert('Comment is too long. Please keep it under 500 characters.')
    return
  }

  submitButton.disabled = true
  submitButton.textContent = 'Posting...'

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        author: name,
        text: text
      }])
      .select()

    if (error) throw error

    // Clear form
    commentName.value = ''
    commentText.value = ''

    // Reload comments
    await loadComments()

    // Scroll to top of comments
    commentsList.scrollIntoView({ behavior: 'smooth' })

  } catch (error) {
    console.error('Error submitting comment:', error)
    console.error('Error details:', error.message)
    alert(`Error posting comment: ${error.message}. Please check the console for details.`)
  } finally {
    submitButton.disabled = false
    submitButton.textContent = 'Post Comment'
  }
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
}
