import { Box, Divider, List, ListItem, ListItemText, Paper, Typography } from "@mui/material"
import { FC, useMemo } from "react"
import { CommonTimeSlot, PersonRangeRecord } from "./constants"
import { BarChart } from "@mui/x-charts/BarChart"
import { styled } from "@mui/material/styles"

const ChartContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 'auto',
  minHeight: 400,
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3)
}))

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

  // Prepare data for horizontal Gantt-like chart
  const chartData = useMemo(() => {
    // Get all person names
    const personNames = Object.keys(personRangeMap);
    if (personNames.length === 0) {
      return {
        personNames: [],
        timeRange: { min: 0, max: 0 },
        seriesData: []
      };
    }
    
    // Get all unique availability slots for time range
    let allSlots: { start: Date; end: Date }[] = [];
    personNames.forEach(name => {
      const person = personRangeMap[name];
      allSlots = [...allSlots, ...person.availableSlots];
    });
    
    if (allSlots.length === 0) {
      return {
        personNames,
        timeRange: { min: Date.now(), max: Date.now() + 3600000 },
        seriesData: []
      };
    }
    
    // Find global min and max times for x-axis scale
    const startTimes = allSlots.map(slot => new Date(slot.start).getTime());
    const endTimes = allSlots.map(slot => new Date(slot.end).getTime());
    const minTime = Math.min(...startTimes);
    const maxTime = Math.max(...endTimes);
    
    // Prepare series data for bar chart
    const seriesData = personNames.map((name) => {
      const slots = personRangeMap[name].availableSlots;
      const data = slots.map(slot => {
        const start = new Date(slot.start).getTime();
        return start - minTime;  // Offset from the minimum time
      });
      const lengths = slots.map(slot => {
        const start = new Date(slot.start).getTime();
        const end = new Date(slot.end).getTime();
        return end - start;  // Duration in milliseconds
      });
      
      return {
        data,
        lengths,
        label: name,
        color: `hsl(${(personNames.indexOf(name) * 70) % 360}, 80%, 65%)`
      };
    });
    
    return {
      personNames,
      timeRange: { min: minTime, max: maxTime },
      seriesData
    };
  }, [personRangeMap]);

  // Format time for x-axis labels
  const formatTime = (value: number) => {
    return new Date(chartData.timeRange.min + value).toLocaleString(undefined, { 
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric', 
      hour12: true 
    });
  };

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
          
          {/* Gantt-like Visualization */}
          {chartData.personNames.length > 0 && (
            <ChartContainer sx={{ height: Math.max(400, chartData.personNames.length * 50) }}>
              {chartData.seriesData.length > 0 && (
                <BarChart
                  layout="horizontal"
                  xAxis={[{
                    scaleType: 'linear',
                    valueFormatter: formatTime,
                    min: 0,
                    max: chartData.timeRange.max - chartData.timeRange.min
                  }]}
                  yAxis={[{
                    scaleType: 'band',
                    data: chartData.personNames
                  }]}
                  series={
                    chartData.seriesData.map((series, index) => ({
                      type: 'bar',
                      data: series.data,
                      label: series.label,
                      stack: 'horizontal',
                      color: series.color
                    }))
                  }
                  height={Math.max(400, chartData.personNames.length * 50)}
                  margin={{ top: 40, bottom: 70, left: 100, right: 20 }}
                />
              )}
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