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
    <Paper sx={{ p: 1, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Common Available Times
      </Typography>
      {intersections.length === 0 ? noIntersections : (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            People's Availability Timeline
          </Typography>
          
          <Gantt personRangeMap={personRangeMap} />
          
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Detailed List View
          </Typography>
          <List>
            {intersections.map((intersection, index) => (
              <Box component="div" key={index}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={
                      new Date(intersection.dtRange.start).toLocaleString() + " - " + new Date(intersection.dtRange.end).toLocaleString()
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          Available People ({intersection.people.length}):
                        </Typography>
                        <Typography component="span" variant="body2" display="block">
                          {intersection.people.join(", ")}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </>
      )}
    </Paper>
  )
}