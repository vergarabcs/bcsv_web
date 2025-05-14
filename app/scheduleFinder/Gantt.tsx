import { FC, useMemo } from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { DateTimeRange, PersonRangeRecord } from "./constants";
import { format } from "date-fns";

const HOUR_WIDTH = 30; // Width in pixels for one hour
const ROW_HEIGHT = 40; // Height in pixels for each person's row
const CHART_PADDING = 16;
const LABEL_WIDTH = 120;

export const Gantt: FC<{
  personRangeMap: PersonRangeRecord;
}> = ({ personRangeMap }) => {
  const theme = useTheme();
  
  // Calculate the chart boundaries - the earliest and latest times
  const chartBoundaries = useMemo(() => {
    let minTime: Date | null = null;
    let maxTime: Date | null = null;
    
    Object.values(personRangeMap).forEach(person => {
      person.availableSlots.forEach(slot => {
        if (!minTime || slot.start < minTime) minTime = slot.start;
        if (!maxTime || slot.end > maxTime) maxTime = slot.end;
      });
    });
    
    // Default to 8am-8pm today if no slots
    if (!minTime || !maxTime) {
      const today = new Date();
      minTime = new Date(today);
      minTime.setHours(8, 0, 0, 0);
      maxTime = new Date(today);
      maxTime.setHours(20, 0, 0, 0);
    }
    
    // Round to the nearest hour
    minTime.setMinutes(0, 0, 0);
    maxTime.setMinutes(0, 0, 0);
    // Add an hour to max time to include the full hour
    maxTime.setHours(maxTime.getHours() + 1);
    
    return { minTime, maxTime };
  }, [personRangeMap]);
  
  // Calculate the timeline hours
  const timelineHours = useMemo(() => {
    const hours = [];
    if (chartBoundaries.minTime && chartBoundaries.maxTime) {
      let currentHour = new Date(chartBoundaries.minTime);
      while (currentHour < chartBoundaries.maxTime) {
        hours.push(new Date(currentHour));
        currentHour.setHours(currentHour.getHours() + 1);
      }
    }
    return hours;
  }, [chartBoundaries]);
  
  // Calculate the chart width
  const chartWidth = useMemo(() => {
    if (!chartBoundaries.minTime || !chartBoundaries.maxTime) return 0;
    const hoursDiff = (chartBoundaries.maxTime.getTime() - chartBoundaries.minTime.getTime()) / (1000 * 60 * 60);
    return hoursDiff * HOUR_WIDTH;
  }, [chartBoundaries]);
  
  // Calculate position and width for a time slot
  const calculateSlotStyle = (slot: DateTimeRange) => {
    if (!chartBoundaries.minTime) return { left: 0, width: 0 };
    
    const startDiff = Math.max(0, (slot.start.getTime() - chartBoundaries.minTime.getTime()) / (1000 * 60 * 60));
    const endDiff = Math.max(0, (slot.end.getTime() - chartBoundaries.minTime.getTime()) / (1000 * 60 * 60));
    const width = Math.max(0, endDiff - startDiff) * HOUR_WIDTH;
    
    return {
      left: startDiff * HOUR_WIDTH,
      width,
    };
  };
  
  // Get color for each person (cyclic)
  const getPersonColor = (index: number) => {
    const colors = [
      theme.palette.primary.light,
      theme.palette.secondary.light,
      theme.palette.success.light,
      theme.palette.info.light,
      theme.palette.warning.light,
    ];
    return colors[index % colors.length];
  };

  const people = Object.values(personRangeMap);
  
  if (people.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="body1">No people added yet. Add people to see their availability.</Typography>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>Availability Chart</Typography>
      
      <Box sx={{ display: "flex", position: "relative", overflow: "hidden" }}>
        {/* Left labels for people names - fixed position */}
        <Box 
          data-testid='person-names' 
          sx={{ 
            width: LABEL_WIDTH, 
            flexShrink: 0, 
            mr: 1,
            position: "sticky",
            left: 0,
            zIndex: 2,
            backgroundColor: theme.palette.background.paper
          }}
        >
          {/* Empty space for timeline */}
          <Box sx={{ height: ROW_HEIGHT }}></Box>
          
          {/* People names */}
          {people.map((person) => (
            <Box 
              key={person.name}
              sx={{ 
                height: ROW_HEIGHT, 
                display: "flex", 
                alignItems: "center",
                fontWeight: "bold"
              }}
            >
              <Typography noWrap variant="body2">{person.name}</Typography>
            </Box>
          ))}
        </Box>
        
        {/* Timeline and slots - scrollable container */}
        <Box sx={{ overflow: "auto", width: `calc(100% - ${LABEL_WIDTH}px)` }}>
          <Box 
            data-testid='timeline' 
            sx={{ position: "relative", minWidth: chartWidth + CHART_PADDING * 2 }}
          >
            {/* Timeline ticks */}
            <Box sx={{ 
              height: ROW_HEIGHT, 
              display: "flex", 
              borderBottom: `1px solid ${theme.palette.divider}` 
            }}>
              {timelineHours.map((hour, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    width: HOUR_WIDTH, 
                    borderRight: index < timelineHours.length - 1 ? `1px solid ${theme.palette.divider}` : "none",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <Typography variant="caption">{format(hour, 'h a')}</Typography>
                </Box>
              ))}
            </Box>
            
            {/* Person rows with available slots */}
            {people.map((person, personIndex) => (
              <Box 
                key={person.name}
                sx={{ 
                  height: ROW_HEIGHT, 
                  position: "relative", 
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}
              >
                {/* Background grid lines */}
                <Box sx={{ display: "flex", height: "100%" }}>
                  {timelineHours.map((_, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        width: HOUR_WIDTH, 
                        height: "100%",
                        borderRight: index < timelineHours.length - 1 ? `1px dashed ${theme.palette.divider}` : "none",
                      }}
                    />
                  ))}
                </Box>
                
                {/* Available time slots */}
                {person.availableSlots.map((slot, slotIndex) => {
                  const { left, width } = calculateSlotStyle(slot);
                  return (
                    <Box 
                      key={slot.id || slotIndex}
                      sx={{
                        position: "absolute",
                        top: 4,
                        bottom: 4,
                        left: left,
                        width: width,
                        backgroundColor: getPersonColor(personIndex),
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden"
                      }}
                    >
                      {width > 50 && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: "0.7rem", 
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            px: 0.5
                          }}
                        >
                          {format(slot.start, 'h:mm a')} - {format(slot.end, 'h:mm a')}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};