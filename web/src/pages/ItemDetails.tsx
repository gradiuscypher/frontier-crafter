import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';

interface Material {
  quantity: number;
  type_id?: number;
  typeID?: number;  // Fallback for raw API data
  name: string;
}

interface FrontierBlueprint {
  bp_id: number;
  structures: string[];
  materials: Material[];
  time: number;
  max_production: number;
  product_count: number;
  product_name: string;
}

const ItemDetails: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [blueprints, setBlueprints] = useState<FrontierBlueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!itemId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:8000/items/${itemId}`);
        if (response.ok) {
          const data = await response.json();
          setBlueprints(data);
        } else if (response.status === 404) {
          setError('Item not found');
        } else {
          setError('Failed to fetch item details');
        }
      } catch (err) {
        setError('Network error occurred');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [itemId]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          Back to Home
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!blueprints.length) {
    return (
      <Box sx={{ mt: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          Back to Home
        </Button>
        <Alert severity="info">No blueprints found for this item.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 3 }}
      >
        Back to Home
      </Button>

      <Typography variant="h3" component="h1" gutterBottom>
        {blueprints[0].product_name}
      </Typography>

      {blueprints.map((blueprint, index) => (
        <Card key={blueprint.bp_id} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PrecisionManufacturingIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5" component="h2">
                Blueprint {index + 1} (ID: {blueprint.bp_id})
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 4, mb: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon sx={{ mr: 1, fontSize: 'small' }} />
                <Typography variant="body2">
                  <strong>Production Time:</strong> {formatTime(blueprint.time)}
                </Typography>
              </Box>
              <Typography variant="body2">
                <strong>Max Production:</strong> {blueprint.max_production.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Product Count:</strong> {blueprint.product_count.toLocaleString()}
              </Typography>
            </Box>

            {blueprint.structures.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Structures
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {blueprint.structures.map((structure, idx) => (
                    <Chip key={idx} label={structure} variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Materials Required
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Material</strong></TableCell>
                    <TableCell align="right"><strong>Quantity</strong></TableCell>
                    <TableCell align="right"><strong>Type ID</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {blueprint.materials.map((material, idx) => {
                    console.log('Material:', material); // Debug log
                    return (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Button
                            variant="text"
                            sx={{
                              textTransform: 'none',
                              p: 0,
                              minWidth: 'auto',
                              justifyContent: 'flex-start',
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline',
                              },
                            }}
                            onClick={() => {
                              console.log('Clicking material:', material);
                              const materialId = material.type_id || material.typeID;
                              navigate(`/item/${materialId}`);
                            }}
                          >
                            {material.name}
                          </Button>
                        </TableCell>
                        <TableCell align="right">
                          {material.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">{material.type_id || material.typeID}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ItemDetails; 