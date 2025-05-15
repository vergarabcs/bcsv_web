import { Box, Divider, List, ListItem, ListItemText, Paper, Typography } from "@mui/material"
import { FC } from "react"
import { CommonTimeSlot, PersonRangeRecord } from "./constants"
import { Gantt } from "./Gantt"

export const Intersections: FC<{
  intersections: CommonTimeSlot[],
  personRangeMap: PersonRangeRecord
}> = (props) => {
  const { intersections, personRangeMap } = props
  const noIntersections = (
    <Typography variant="body1" color="text.secondary">
      No common time slots found. Add more people and availability.
    </Typography>
  )

  return (
    <Paper sx={{ p: 1, mt: 3 }} role="region" aria-labelledby="intersections-heading">
      <Typography variant="h6" gutterBottom id="intersections-heading">
        Common Available Times
      </Typography>
      {intersections.length === 0 ? noIntersections : (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            People's Availability Timeline
          </Typography>
          
          <Gantt personRangeMap={personRangeMap} />
          
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }} id="detailed-list-heading">
            Detailed List View
          </Typography>
          <List aria-labelledby="detailed-list-heading">
            {intersections.map((intersection, index) => {
              const startDate = new Date(intersection.dtRange.start);
              const endDate = new Date(intersection.dtRange.end);
              const timeSlotId = `timeslot-${index}`;
              const availablePeopleId = `available-people-${index}`;
              
              return (
                <Box component="div" key={index}>
                  {index > 0 && <Divider />}
                  <ListItem role="listitem">
                    <ListItemText
                      primary={
                        <span id={timeSlotId}>
                          {startDate.toLocaleString()} - {endDate.toLocaleString()}
                        </span>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" id={availablePeopleId}>
                            Available People ({intersection.people.length}):
                          </Typography>
                          <Typography component="span" variant="body2" display="block" aria-labelledby={availablePeopleId}>
                            {intersection.people.join(", ")}
                          </Typography>
                        </>
                      }
                      aria-describedby={`${timeSlotId} ${availablePeopleId}`}
                    />
                  </ListItem>
                </Box>
              );
            })}
          </List>
        </>
      )}
    </Paper>
  )
}