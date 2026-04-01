import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { MoreVert as MoreVertIcon, PlayArrow as PlayIcon, Stop as StopIcon } from '@mui/icons-material';
import { useDoublesQueueStore } from '../useDoublesQueueStore';
import { GameStatus } from '../types';

interface SessionMenuProps {
  onRequestEndSession?: () => void;
}

const SessionMenu: React.FC<SessionMenuProps> = ({ onRequestEndSession }) => {
  const { currentSession, games, initializeSession, endSession } = useDoublesQueueStore();
  const isActive = currentSession?.isActive;
  const inProgressGames = games.filter(g => g.status === GameStatus.IN_PROGRESS).length;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title="Session actions">
        <IconButton size="small" color="inherit" aria-label="more" onClick={handleOpen}>
          <MoreVertIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {isActive ? (
          <MenuItem
            disabled={inProgressGames > 0}
            onClick={() => {
              if (inProgressGames > 0) return;
              if (onRequestEndSession) {
                onRequestEndSession();
              } else {
                endSession();
              }
              handleClose();
            }}
          >
            <StopIcon sx={{ mr: 1 }} /> End Session
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              initializeSession();
              handleClose();
            }}
          >
            <PlayIcon sx={{ mr: 1 }} /> Start Session
          </MenuItem>
        )}

        <MenuItem disabled>Undo (placeholder)</MenuItem>
      </Menu>
    </>
  );
};

export default SessionMenu;
