# Fix Mobile Keyboard for Leaderboard Input

## Problem

On mobile devices, when users try to enter their initials and email in the leaderboard fields, the mobile virtual keyboard does not appear. This is because:

1. **Current Implementation**: Uses Phaser's keyboard event handlers (`this.input.keyboard!.on('keydown', ...)`)
2. **Mobile Limitation**: Mobile virtual keyboards only appear when native HTML `<input>` or `<textarea>` elements receive focus
3. **Phaser Objects**: The current inputs are Phaser Text objects, not native HTML elements
4. **Result**: Users cannot type because the keyboard never appears

**Note**: The functionality works fine on desktop because desktop has physical keyboards. The issue is mobile-specific.

## Solution Overview

Use a **hybrid approach**:
- **Desktop**: Keep existing Phaser keyboard input (works perfectly)
- **Mobile**: Overlay invisible native HTML input elements that trigger the mobile keyboard, syncing their values to the Phaser display

## Implementation Plan

### File: `src/main.ts`

#### 1. Add HTML Input Elements (Mobile Only)

**Location**: In `showLeaderboardScreen()` method, after creating the Phaser input fields

**Steps**:
- Create two invisible HTML `<input>` elements:
  - `initialsHTMLInput`: For initials (maxlength=3, pattern for letters only)
  - `emailHTMLInput`: For email (type="email")
- Position them exactly over the Phaser input boxes using absolute positioning
- Style them to be invisible (opacity: 0 or transparent background) but maintain their position and size
- Append them to the Phaser canvas container or game container

#### 2. Mobile Detection & Conditional Input Setup

**Location**: In `setupLeaderboardInput()` method

**Steps**:
- Detect if running on mobile device (use existing `isMobileDevice()` method)
- **If Mobile**:
  - Hide Phaser keyboard event handlers
  - Set up focus handlers for HTML inputs instead
  - Sync HTML input values to Phaser text display on input/change events
  - Handle blur events to update current input state
- **If Desktop**:
  - Keep existing Phaser keyboard handlers (no changes needed)

#### 3. Sync HTML Input to Phaser Display

**Location**: New methods or within `setupLeaderboardInput()`

**Steps**:
- Create sync functions:
  - `syncInitialsInput()`: Reads from HTML input, updates `this.initialsText` and Phaser text
  - `syncEmailInput()`: Reads from HTML input, updates `this.emailText` and Phaser text
- Apply validation (initials: 3 chars max, letters only; email: standard format)
- Update highlighting when focus changes

#### 4. Handle Focus Switching

**Location**: In click handlers for `initialsBox` and `emailBox`

**Steps**:
- **On Mobile**: When box is clicked, focus the corresponding HTML input (triggers keyboard)
- **On Desktop**: Keep existing behavior (just switch `currentInput` state)
- Update `updateInputHighlight()` to handle both cases

#### 5. Cleanup

**Location**: When leaderboard screen is hidden or game restarts

**Steps**:
- Remove HTML input elements from DOM
- Clean up event listeners
- Reset input state

### Technical Details

#### HTML Input Positioning
```typescript
// Calculate position based on Phaser world coordinates
// Account for canvas scaling on mobile
// Position absolutely within game container
```

#### Styling HTML Inputs
```css
- opacity: 0 (invisible but functional)
- position: absolute
- Match exact size of Phaser input boxes
- Use same font size for proper keyboard type
```

#### Input Attributes
- Initials input: `type="text"`, `maxlength="3"`, `pattern="[A-Za-z]*"`, `inputmode="text"`
- Email input: `type="email"`, `inputmode="email"`

#### Event Handling
- `focus`: When input receives focus (keyboard appears)
- `input`: On each keystroke (sync to Phaser)
- `blur`: When input loses focus
- `keydown`: Handle Enter/Tab to switch fields

## Testing Checklist

- [ ] Mobile: Keyboard appears when clicking initials field
- [ ] Mobile: Keyboard appears when clicking email field  
- [ ] Mobile: Typing in initials field updates Phaser display
- [ ] Mobile: Typing in email field updates Phaser display
- [ ] Mobile: Validation works (initials max 3 chars, letters only)
- [ ] Mobile: Can switch between fields by clicking boxes
- [ ] Mobile: Submit works with data from HTML inputs
- [ ] Desktop: All existing functionality still works (keyboard input)
- [ ] Both: Visual highlighting works correctly
- [ ] Both: Cleanup works when restarting game

## Edge Cases to Consider

1. **Canvas scaling on mobile**: HTML inputs must account for canvas transform/scale
2. **Screen rotation**: Reposition inputs if orientation changes
3. **Keyboard dismissal**: Handle when user dismisses keyboard
4. **Focus conflicts**: Ensure HTML inputs don't interfere with game canvas interaction
5. **Z-index**: HTML inputs must be above canvas but below UI overlays

## Files to Modify

- `src/main.ts`: Main implementation
- Potentially add CSS to `index.html` if needed for input styling

## Risk Assessment

- **Low Risk**: Desktop functionality unchanged (mobile-only enhancement)
- **Medium Risk**: HTML positioning might need fine-tuning for different screen sizes
- **Mitigation**: Test on multiple mobile devices and screen sizes

