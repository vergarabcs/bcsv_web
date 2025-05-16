import { useContext, useState, useEffect } from "react";
import { useScheduleFinder } from "./useScheduleFinder";
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  Paper, 
  TextField, 
  Typography 
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import withSession from "@/app/lib/components/withSession";
import { Intersections } from "./Intersections";
import { SessionContext } from "@/app/constants";
import { ampClient } from "../lib/amplifyClient";


const DeleteButton: React.FC<{ selectedPerson: string | null; onClick: () => void }> = ({ selectedPerson, onClick }) => {
  
  if(!selectedPerson) return null;

  return <IconButton 
    onClick={onClick} 
    aria-label={`Delete ${selectedPerson}`}
    title={`Delete ${selectedPerson}`}
  >
    <DeleteIcon />
  </IconButton>
}

const ScheduleFinder = () => {
  const {
    addPerson,
    addRange,
    intersections,
    personRangeMap,
    removePerson,
    removeRange,
    setDate,
    sessionId
  } = useScheduleFinder();
  const session = useContext(SessionContext);

  const [newPersonName, setNewPersonName] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddPerson = () => {
    if (!newPersonName.trim()) {
      setError("Please enter a name");
      return;
    }
    
    const success = addPerson(newPersonName);
    if (success) {
      setNewPersonName("");
      setSelectedPerson(newPersonName);
      setError(null);
    } else {
      setError("Person already exists");
    }
  };

  const handleAddTimeSlot = (personName: string) => {
    addRange(personName);
  };

  const handleSetDate = (
    personName: string, 
    id: string, 
    boundName: 'start' | 'end', 
    date: Date
  ) => {
    const person = personRangeMap[personName];
    const slot = person.availableSlots.find(slot => slot.id === id);
    
    if (!slot) return;
    
    // Validate that end time is after start time
    if (boundName === 'end' && date <= slot.start) {
      setError("End time must be after start time");
      return;
    }
    
    if (boundName === 'start' && slot.end && date >= slot.end) {
      setError("Start time must be before end time");
      return;
    }
    
    setError(null);
    setDate(personName, id, boundName, date);
  };

  const handleSelectPerson = (personName: string) => {
    setSelectedPerson(personName)
    setError(null)
  }

  // Handle keyboard navigation for list items
  const handlePersonKeyDown = (event: React.KeyboardEvent, personName: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelectPerson(personName);
    }
  };

  // Focus first text field when component mounts
  useEffect(() => {
    const firstInput = document.getElementById('person-name-input');
    if (firstInput) {
      firstInput.focus();
    }
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box 
        maxWidth="lg" 
        sx={{ mt: 4, mb: 4, p: 1 }}
        role="main"
        aria-label="Schedule Finder Application"
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '2rem', my: '1rem'}}>
          <Typography variant="body1">
            Session Id: {sessionId ?? ''}
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={session.leaveSession} 
            color="error"
            aria-label="Leave current session"
          >
            Leave Session 
          </Button>
        </Box>
        {/* Add Person Section */}
        <Paper sx={{ p: 1, mb: 3 }} component="section" aria-labelledby="add-person-heading">
          <Typography id="add-person-heading" variant="h6" sx={{ mb: 1 }} component="h2">
            Add a Person
          </Typography>
          <Box 
            sx={{ display: 'flex', alignItems: 'center' }}
            role="form"
            aria-labelledby="add-person-heading"
          >
            <TextField
              id="person-name-input"
              fullWidth
              label="Person Name"
              variant="outlined"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              error={!!error && error.includes("name")}
              helperText={error && error.includes("name") ? error : ""}
              sx={{ mr: 2 }}
              inputProps={{
                'aria-label': 'Person name',
                'aria-describedby': error && error.includes("name") ? 'person-name-error' : undefined,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddPerson();
                }
              }}
            />
            {error && error.includes("name") && (
              <span id="person-name-error" role="alert" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
                {error}
              </span>
            )}
            <Button 
              variant="contained" 
              startIcon={<PersonAddIcon />}
              onClick={handleAddPerson}
              aria-label="Add person to schedule"
            >
              Add Person
            </Button>
          </Box>
        </Paper>
        
        {/* People and Time Slots Section */}
        <Grid container spacing={3}>
          <Grid component="section" sx={{ gridColumn: { xs: "span 12", md: "span 4" } }} aria-labelledby="people-heading">
            <Paper sx={{ p: 1, height: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" gutterBottom id="people-heading">
                  People
                </Typography>
                <DeleteButton onClick={() => selectedPerson && removePerson(selectedPerson)} selectedPerson={selectedPerson}/>
              </Box>
              <List role="listbox" aria-labelledby="people-heading">
                {Object.values(personRangeMap).map((person) => (
                  <ListItem 
                    key={person.name}
                    onClick={() => handleSelectPerson(person.name)}
                    onKeyDown={(e) => handlePersonKeyDown(e, person.name)}
                    role="option"
                    aria-selected={selectedPerson === person.name}
                    tabIndex={0}
                    sx={{
                      bgcolor: selectedPerson === person.name ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                      cursor: 'pointer',
                      borderRadius: 1
                    }}
                  >
                    <ListItemText 
                      primary={person.name} 
                      secondary={`${person.availableSlots.length} time slots`} 
                      primaryTypographyProps={{
                        'aria-label': `${person.name} with ${person.availableSlots.length} time slots`
                      }}
                    />
                  </ListItem>
                ))}
                {Object.values(personRangeMap).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No people added yet. Use the form above to add people.
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>
          
          <Grid component="section" sx={{ gridColumn: { xs: "span 12", md: "span 8" } }} aria-labelledby="time-slots-heading">
            <Paper sx={{ p: 1, height: '100%' }}>
              {selectedPerson ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, width: "100%" }}>
                    <Typography variant="h6" id="time-slots-heading">
                      Time Slots for {selectedPerson}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />}
                      onClick={() => handleAddTimeSlot(selectedPerson)}
                      aria-label={`Add time slot for ${selectedPerson}`}
                    >
                      Add Time Slot
                    </Button>
                  </Box>
                  
                  {error && !error.includes("name") && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }} role="alert">
                      {error}
                    </Typography>
                  )}
                  
                  {personRangeMap[selectedPerson]?.availableSlots.length === 0 ? (
                    <Typography variant="body1" color="text.secondary">
                      No time slots added yet. Click "Add Time Slot" to get started.
                    </Typography>
                  ) : (
                    <div role="list" aria-label={`Time slots for ${selectedPerson}`}>
                      {personRangeMap[selectedPerson]?.availableSlots.map((slot) => (
                        <Card key={slot.id} sx={{ mb: 2 }} component="article" role="listitem">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle1" id={`time-slot-${slot.id}`}>
                                Time Slot
                              </Typography>
                              <IconButton 
                                edge="end" 
                                aria-label={`Delete time slot`}
                                onClick={() => removeRange(selectedPerson, slot.id!)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                            <Grid container spacing={2}>
                              <Grid component="div" sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                                <DateTimePicker
                                  label="Start Time"
                                  value={slot.start}
                                  onChange={(newDate) => newDate && handleSetDate(selectedPerson, slot.id!, 'start', newDate)}
                                  slotProps={{
                                    textField: {
                                      fullWidth: true,
                                      variant: 'outlined',
                                      inputProps: {
                                        'aria-labelledby': `time-slot-${slot.id}`,
                                        'aria-label': 'Start time'
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                              <Grid component="div" sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                                <DateTimePicker
                                  label="End Time"
                                  value={slot.end}
                                  onChange={(newDate) => newDate && handleSetDate(selectedPerson, slot.id!, 'end', newDate)}
                                  slotProps={{
                                    textField: {
                                      fullWidth: true,
                                      variant: 'outlined',
                                      inputProps: {
                                        'aria-labelledby': `time-slot-${slot.id}`,
                                        'aria-label': 'End time'
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Typography variant="body1" color="text.secondary" id="time-slots-heading">
                  Select a person from the list to manage their time slots.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
        
        <Intersections personRangeMap={personRangeMap} intersections={intersections}/>
      </Box>
    </LocalizationProvider>
  );
};

export default withSession(ScheduleFinder, ampClient.models.ScheduleFinder);