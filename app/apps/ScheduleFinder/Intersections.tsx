import { Box, Divider, List, ListItem, ListItemText, Paper, Typography } from "@mui/material"
import { FC } from "react"
import { CommonTimeSlot } from "./constants"
import { BarChart } from "@mui/x-charts/BarChart"
import { styled } from "@mui/material/styles"

const ChartContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 300,
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3)
}))

export const Intersections: FC<{
  intersections: CommonTimeSlot[]
}> = (props) => {
  const {intersections} = props
  const noIntersections = (
    <Typography variant="body1" color="text.secondary">
      No common time slots found. Add more people and availability.
    </Typography>
  )

  // Format data for the bar chart
  const chartData = intersections.map((intersection, index) => ({
    timeSlot: `Slot ${index + 1}`,
    count: intersection.people.length,
    label: `${new Date(intersection.dtRange.start).toLocaleTimeString()} - ${new Date(intersection.dtRange.end).toLocaleTimeString()}`
  }));

  return (
    <Paper sx={{ p: 1, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Common Available Times
      </Typography>
      {intersections.length === 0 ? noIntersections : (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Showing time slots sorted by the number of available people
          </Typography>
          
          {/* Bar Chart Visualization */}
          {intersections.length > 0 && (
            <ChartContainer>
              <BarChart
                xAxis={[{
                  scaleType: 'band',
                  data: chartData.map(item => item.label),
                  tickLabelStyle: {
                    angle: 45,
                    textAnchor: 'start',
                    fontSize: 12
                  }
                }]}
                series={[{
                  data: chartData.map(item => item.count),
                  label: 'Available People',
                  color: '#2196f3'
                }]}
                height={280}
                margin={{ top: 10, bottom: 70, left: 40, right: 10 }}
              />
            </ChartContainer>
          )}
          
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