'use client';

import { useEffect, useMemo, useState } from 'react';
import Cropper from 'react-easy-crop';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { api } from '@/utils/api';
import './ChannelPartner.css';

let statesCache = null;
let statesCachePromise = null;
let citiesCacheByState = {};
let citiesCachePromiseByState = {};

export default function ChannelPartner() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editOriginal, setEditOriginal] = useState(null);
  const [editTouched, setEditTouched] = useState({});
  const [existingPhotoPath, setExistingPhotoPath] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [partners, setPartners] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesError, setStatesError] = useState('');
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapPicked, setMapPicked] = useState(null);
  const [mapOpenNonce, setMapOpenNonce] = useState(0);
  const [leafletReady, setLeafletReady] = useState(false);
  const [leafletComponents, setLeafletComponents] = useState(null);
  const [leafletMarkerIcon, setLeafletMarkerIcon] = useState(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [form, setForm] = useState({
    photo: null,
    name: '',
    companyName: '',
    address: '',
    latitude: '',
    longitude: '',
    stateId: '',
    city: '',
    designation: '',
    mobile: '',
    whatsapp: '',
  });

  const closeModal = () => {
    setIsAddOpen(false);
    setSubmitting(false);
    setError('');
    setPhotoError('');
    setFieldErrors({});
    setIsEditMode(false);
    setEditingId(null);
    setEditLoading(false);
    setEditOriginal(null);
    setEditTouched({});
    setExistingPhotoPath('');
    setStatesError('');
    setCities([]);
    setCitiesError('');
    setCitiesLoading(false);
    setIsMapOpen(false);
    setMapPicked(null);
    setIsCropOpen(false);
    setCropImageSrc('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setForm({
      photo: null,
      name: '',
      companyName: '',
      address: '',
      latitude: '',
      longitude: '',
      stateId: '',
      city: '',
      designation: '',
      mobile: '',
      whatsapp: '',
    });
  };

  const loadCitiesByStateId = async (stateId) => {
    const id = toIdValue(stateId).trim();
    if (!id) {
      setCities([]);
      return;
    }

    if (Array.isArray(citiesCacheByState?.[id]) && citiesCacheByState[id].length) {
      setCities(citiesCacheByState[id]);
      return;
    }

    try {
      setCitiesLoading(true);
      setCitiesError('');

      if (!citiesCachePromiseByState[id]) {
        citiesCachePromiseByState[id] = api
          .get(`/states/${id}/cities`)
          .then((resp) => {
            const list = Array.isArray(resp?.data?.data) ? resp.data.data : [];
            citiesCacheByState[id] = list;
            return list;
          })
          .finally(() => {
            citiesCachePromiseByState[id] = null;
          });
      }

      const list = await citiesCachePromiseByState[id];
      setCities(Array.isArray(list) ? list : []);
    } catch (e) {
      setCities([]);
      setCitiesError(e?.message || 'Failed to load cities');
    } finally {
      setCitiesLoading(false);
    }
  };

  const onChange = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (isEditMode) {
      setEditTouched((t) => ({ ...t, [key]: true }));
    }
  };

  const onDigitsChange = (key, value) => {
    const digitsOnly = String(value || '').replace(/\D/g, '');
    onChange(key, digitsOnly);
  };

  const previewUrl = useMemo(() => {
    if (!form.photo) return '';
    const url = URL.createObjectURL(form.photo);
    return url;
  }, [form.photo]);

  const partnerPhotoUrl = (photoPath) => {
    if (!photoPath) return '';
    const path = String(photoPath).trim();
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const clean = path.replace(/^\/+/, '');
    return `https://qbits.quickestimate.co/storage/${clean}`;
  };

  const toIdValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      const v = value;
      if ('id' in v && (typeof v.id === 'string' || typeof v.id === 'number')) return String(v.id);
      if ('value' in v && (typeof v.value === 'string' || typeof v.value === 'number')) return String(v.value);
    }
    return '';
  };

  useEffect(() => {
    if (!isMapOpen) return;
    let cancelled = false;

    const loadLeaflet = async () => {
      try {
        const [{ MapContainer, Marker, TileLayer, useMapEvents }, L] = await Promise.all([
          import('react-leaflet'),
          import('leaflet'),
        ]);

        await import('leaflet/dist/leaflet.css');

        if (cancelled) return;

        const icon = new L.Icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });

        setLeafletComponents({ MapContainer, Marker, TileLayer, useMapEvents });
        setLeafletMarkerIcon(icon);
        setLeafletReady(true);
      } catch (e) {
        setLeafletReady(false);
      }
    };

    loadLeaflet();
    return () => {
      cancelled = true;
    };
  }, [isMapOpen]);

  const mapDefaultCenter = useMemo(() => ({ lat: 22.2587, lng: 71.1924 }), []);
  const mapDefaultZoom = 6;

  const openMapPicker = () => {
    setError('');
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    const isValid =
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      !(lat === 0 && lng === 0) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    if (isValid) {
      setMapPicked({ lat, lng });
    } else {
      setMapPicked(null);
    }
    setMapOpenNonce((n) => n + 1);
    setIsMapOpen(true);
  };

  const closeMapPicker = () => {
    setIsMapOpen(false);
    setMapPicked(null);
  };

  const usePickedLocation = () => {
    if (!mapPicked) {
      setError('Please select a location on map.');
      return;
    }
    onChange('latitude', String(mapPicked.lat));
    onChange('longitude', String(mapPicked.lng));
    setIsMapOpen(false);
  };

  const MapClickHandler = ({ onPick }) => {
    const useMapEventsFn = leafletComponents?.useMapEvents;
    if (!useMapEventsFn) return null;
    useMapEventsFn({
      click(e) {
        const lat = e?.latlng?.lat;
        const lng = e?.latlng?.lng;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        onPick({ lat, lng });
      },
    });
    return null;
  };

  const editPhotoUrl = useMemo(() => {
    if (!isEditMode) return '';
    if (form.photo) return '';
    if (!existingPhotoPath) return '';
    return partnerPhotoUrl(existingPhotoPath);
  }, [existingPhotoPath, form.photo, isEditMode]);

  useEffect(() => {
    return () => {
      if (cropImageSrc && cropImageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(cropImageSrc);
      }
    };
  }, [cropImageSrc]);

  const onCropComplete = (_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  };

  const getCroppedImageFile = async (imageSrc, areaPixels) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(areaPixels.width));
    canvas.height = Math.max(1, Math.floor(areaPixels.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    ctx.drawImage(
      image,
      areaPixels.x,
      areaPixels.y,
      areaPixels.width,
      areaPixels.height,
      0,
      0,
      areaPixels.width,
      areaPixels.height
    );

    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9);
    });
    if (!blob) throw new Error('Failed to crop image');

    const file = new File([blob], 'channel-partner.jpg', { type: 'image/jpeg' });
    return file;
  };

  const onPhotoSelected = (file) => {
    setPhotoError('');
    if (!file) {
      onChange('photo', null);
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setPhotoError('Photo must be less than 2MB.');
      onChange('photo', null);
      return;
    }

    if (cropImageSrc && cropImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(cropImageSrc);
    }

    const src = URL.createObjectURL(file);
    setCropImageSrc(src);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropOpen(true);
  };

  const confirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) {
      setPhotoError('Please crop the photo in square box.');
      return;
    }

    try {
      const croppedFile = await getCroppedImageFile(cropImageSrc, croppedAreaPixels);
      const maxBytes = 2 * 1024 * 1024;
      if (croppedFile.size > maxBytes) {
        setPhotoError('Cropped photo must be less than 2MB.');
        return;
      }
      onChange('photo', croppedFile);
      setIsCropOpen(false);
    } catch (e) {
      setPhotoError(e?.message || 'Failed to crop image');
    }
  };

  const cancelCrop = () => {
    setIsCropOpen(false);
    setCropImageSrc('');
    setCroppedAreaPixels(null);
  };

  const renderText = (value) => {
    if (value === null || value === undefined || value === '') return '--';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'object') {
      if ('name' in value && (typeof value.name === 'string' || typeof value.name === 'number')) {
        return String(value.name);
      }
      if ('id' in value && (typeof value.id === 'string' || typeof value.id === 'number')) {
        return String(value.id);
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  const formatDateDDMMYYYY = (value) => {
    if (!value) return '--';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '--';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  };

  const fetchPartners = async (nextPage = 1) => {
    try {
      setListLoading(true);
      setListError('');
      const resp = await api.get('/channel-partners', { params: { page: nextPage } });
      const payload = resp?.data;
      const data = payload?.data;

      const rows = Array.isArray(data?.data) ? data.data : [];

      setPartners(rows);
      setPagination({
        currentPage: Number(data?.current_page || nextPage) || nextPage,
        lastPage: Number(data?.last_page || 1) || 1,
        total: Number(data?.total || rows.length) || rows.length,
      });
      setPage(nextPage);
    } catch (e) {
      setPartners([]);
      setPagination({ currentPage: 1, lastPage: 1, total: 0 });
      setListError(e?.message || 'Failed to load channel partners');
    } finally {
      setListLoading(false);
    }
  };

  const onEditPartner = (partner) => {
    const id = partner?.id;
    if (!id) return;

    // Prefill instantly from row data (removes perceived latency)
    const rowStateId = toIdValue(partner?.state);
    const rowCity = toIdValue(partner?.city) || String(partner?.city ?? '');
    setExistingPhotoPath(partner?.photo || '');
    setForm((prev) => ({
      ...prev,
      photo: null,
      name: partner?.name ?? '',
      companyName: partner?.company_name ?? '',
      address: partner?.address ?? '',
      latitude: partner?.latitude ?? '',
      longitude: partner?.longitude ?? '',
      stateId: rowStateId,
      city: rowCity,
      designation: partner?.designation ?? '',
      mobile: partner?.mobile ?? '',
      whatsapp: partner?.whatsapp_no ?? '',
    }));

    if (rowStateId) {
      loadCitiesByStateId(rowStateId);
    } else {
      setCities([]);
    }

    setIsAddOpen(true);
    setIsEditMode(true);
    setEditingId(id);
    setEditLoading(true);
    setError('');
    setPhotoError('');
    setFieldErrors({});
    setEditTouched({});

    api
      .get(`/channel-partners/${id}`, { headers: { Accept: 'application/json' } })
      .then((resp) => {
        const data = resp?.data?.data ?? resp?.data;
        if (!data || typeof data !== 'object') throw new Error('Invalid response');

        const nextStateId = toIdValue(data?.state);
        if (nextStateId) {
          loadCitiesByStateId(nextStateId);
        } else {
          setCities([]);
        }

        setEditOriginal(data);
        setExistingPhotoPath(data?.photo || partner?.photo || '');

        setForm((prev) => ({
          ...prev,
          photo: null,
          name: editTouched?.name ? prev.name : (data?.name ?? ''),
          companyName: editTouched?.companyName ? prev.companyName : (data?.company_name ?? ''),
          address: editTouched?.address ? prev.address : (data?.address ?? ''),
          latitude: editTouched?.latitude ? prev.latitude : (data?.latitude ?? ''),
          longitude: editTouched?.longitude ? prev.longitude : (data?.longitude ?? ''),
          stateId: editTouched?.stateId ? prev.stateId : toIdValue(data?.state),
          city: editTouched?.city ? prev.city : (toIdValue(data?.city) || String(data?.city ?? '')),
          designation: editTouched?.designation ? prev.designation : (data?.designation ?? ''),
          mobile: editTouched?.mobile ? prev.mobile : (data?.mobile ?? ''),
          whatsapp: editTouched?.whatsapp ? prev.whatsapp : (data?.whatsapp_no ?? ''),
        }));
      })
      .catch((err) => {
        const msg =
          err?.data?.message ||
          err?.original?.response?.data?.message ||
          err?.response?.data?.message ||
          err?.message;
        setError(msg || 'Failed to load partner');
      })
      .finally(() => {
        setEditLoading(false);
      });
  };

  const onDeletePartner = async (partner) => {
    const id = partner?.id;
    if (!id) return;

    const ok = window.confirm('Are you sure you want to delete this channel partner?');
    if (!ok) return;

    try {
      setDeletingId(id);
      setListError('');
      const resp = await api.delete(`/channel-partners/${id}`, {
        headers: {
          Accept: 'application/json'
        }
      });

      if (resp?.data && resp.data.status === false) {
        throw new Error(resp?.data?.message || 'Failed to delete');
      }

      setPartners((prev) => (Array.isArray(prev) ? prev.filter((x) => x?.id !== id) : prev));
      fetchPartners(page);
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.original?.response?.data?.message ||
        err?.response?.data?.message ||
        err?.message;
      setListError(msg || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const loadStates = async () => {
    if (Array.isArray(statesCache) && statesCache.length) {
      setStates(statesCache);
      return;
    }

    try {
      setStatesLoading(true);
      setStatesError('');

      if (!statesCachePromise) {
        statesCachePromise = api
          .get('/states')
          .then((resp) => {
            const list = Array.isArray(resp?.data?.data) ? resp.data.data : [];
            statesCache = list;
            return list;
          })
          .finally(() => {
            statesCachePromise = null;
          });
      }

      const list = await statesCachePromise;
      setStates(list);
    } catch (e) {
      setStates([]);
      setStatesError(e?.message || 'Failed to load states');
    } finally {
      setStatesLoading(false);
    }
  };

  useEffect(() => {
    loadStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPartners(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAddOpen) return;
    loadStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddOpen]);

  useEffect(() => {
    if (!isAddOpen) return;
    if (!form.stateId) {
      setCities([]);
      return;
    }
    loadCitiesByStateId(form.stateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddOpen, form.stateId]);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setPhotoError('');
    setFieldErrors({});

    if (!isEditMode) {
      const required = [
        ['photo', form.photo],
        ['name', form.name.trim()],
        ['companyName', form.companyName.trim()],
        ['address', form.address.trim()],
        ['latitude', form.latitude.trim()],
        ['longitude', form.longitude.trim()],
        ['state', String(form.stateId).trim()],
        ['city', form.city.trim()],
        ['designation', form.designation.trim()],
        ['mobile', form.mobile.trim()],
        ['whatsapp', form.whatsapp.trim()],
      ];

      const missing = required.find(([, v]) => !v);
      if (missing) {
        setError('All fields are required.');
        return;
      }

      if (form.mobile.trim().length !== 10) {
        setError('Mobile number must be exactly 10 digits.');
        return;
      }

      if (form.whatsapp.trim().length !== 10) {
        setError('Whatsapp number must be exactly 10 digits.');
        return;
      }
    } else {
      // Edit mode: all fields are optional; validate only if user provided a value.
      if (form.mobile && String(form.mobile).trim() !== '' && String(form.mobile).trim().length !== 10) {
        setError('Mobile number must be exactly 10 digits.');
        return;
      }

      if (form.whatsapp && String(form.whatsapp).trim() !== '' && String(form.whatsapp).trim().length !== 10) {
        setError('Whatsapp number must be exactly 10 digits.');
        return;
      }
    }

    try {
      setSubmitting(true);

      const fd = new FormData();
      const appendIfChanged = (key, value, original) => {
        const v = value === null || value === undefined ? '' : String(value);
        const o = original === null || original === undefined ? '' : String(original);
        if (v.trim() === o.trim()) return;
        if (v.trim() === '') return;
        fd.append(key, v);
      };

      const appendRequired = (key, currentValue, fallbackValue) => {
        const v = currentValue === null || currentValue === undefined ? '' : String(currentValue);
        const f = fallbackValue === null || fallbackValue === undefined ? '' : String(fallbackValue);
        const finalVal = v.trim() !== '' ? v.trim() : f.trim();
        if (finalVal !== '') fd.append(key, finalVal);
      };

      if (isEditMode) {
        if (form.photo) fd.append('photo', form.photo);

        // Backend appears to validate required fields even on update.
        // So we always send required fields with either the current form value
        // or a fallback from editOriginal.
        appendRequired('name', form.name, editOriginal?.name);
        appendRequired('company_name', form.companyName, editOriginal?.company_name);
        appendRequired('designation', form.designation, editOriginal?.designation);
        appendRequired('mobile', form.mobile, editOriginal?.mobile);
        appendRequired('whatsapp_no', form.whatsapp, editOriginal?.whatsapp_no);
        appendRequired('address', form.address, editOriginal?.address);
        appendRequired('state', toIdValue(form.stateId), toIdValue(editOriginal?.state));
        appendRequired('city', toIdValue(form.city) || form.city, toIdValue(editOriginal?.city) || editOriginal?.city);
        appendRequired('latitude', form.latitude, editOriginal?.latitude);
        appendRequired('longitude', form.longitude, editOriginal?.longitude);
      } else {
        fd.append('photo', form.photo);
        fd.append('name', form.name.trim());
        fd.append('company_name', form.companyName.trim());
        fd.append('designation', form.designation.trim());
        fd.append('mobile', form.mobile.trim());
        fd.append('whatsapp_no', form.whatsapp.trim());
        fd.append('address', form.address.trim());
        fd.append('state', toIdValue(form.stateId).trim());
        fd.append('city', toIdValue(form.city).trim() || String(form.city || '').trim());
        fd.append('latitude', form.latitude.trim());
        fd.append('longitude', form.longitude.trim());
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json'
        }
      };

      let resp;
      if (isEditMode && editingId) {
        resp = await api.post(`/channel-partners/${editingId}`, fd, config);
      } else {
        resp = await api.post('/channel-partners', fd, config);
      }

      if (!resp?.data?.status) {
        const msg = resp?.data?.message || 'Failed to create channel partner';
        throw new Error(msg);
      }

      closeModal();
      alert(resp?.data?.message || (isEditMode ? 'Channel Partner updated successfully.' : 'Channel Partner created successfully.'));
      fetchPartners(1);
    } catch (err) {
      const apiErrors = err?.data?.errors || err?.original?.response?.data?.errors || err?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        setFieldErrors(apiErrors);
      }
      const msg =
        err?.data?.message ||
        err?.original?.response?.data?.message ||
        err?.response?.data?.message ||
        (typeof err?.data === 'string' ? err.data : '') ||
        (typeof err?.original?.response?.data === 'string' ? err.original.response.data : '') ||
        err?.message;
      setError(msg || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="col-xl-12">
      <div className="card-qbits-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5>Authorized Service Partner</h5>
          <div className="cp-header-actions">
            <button
              type="button"
              className="cp-add-btn"
              onClick={() => {
                setIsEditMode(false);
                setEditingId(null);
                setFieldErrors({});
                setError('');
                setPhotoError('');
                setIsAddOpen(true);
              }}
            >
              +Add
            </button>
          </div>
        </div>
        <div className="card-body">
          {listLoading ? (
            <div className="text-muted">Loading channel partners...</div>
          ) : listError ? (
            <div className="cp-table-error" role="alert">{listError}</div>
          ) : !Array.isArray(partners) || partners.length === 0 ? (
            <div className="text-muted">No channel partners found.</div>
          ) : (
            <div className="cp-table-wrap">
              <div className="cp-table-scroll">
                <table className="cp-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Photo</th>
                      <th>Name</th>
                      <th>Company Name</th>
                      <th>Designation</th>
                      <th>Mobile</th>
                      <th>Whatsapp No.</th>
                      <th>Address</th>
                      <th>State</th>
                      <th>City</th>
                      <th>Latitude</th>
                      <th>Longitude</th>
                      <th>Created At</th>
                      <th>Updated At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>
                          {p.photo ? (
                            <div className="cp-table-photo-box">
                              <img
                                className="cp-table-photo"
                                src={partnerPhotoUrl(p.photo)}
                                alt={p.name || 'Photo'}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent && !parent.querySelector('.cp-table-photo-fallback')) {
                                    const span = document.createElement('span');
                                    span.className = 'cp-table-photo-fallback';
                                    span.textContent = '--';
                                    parent.appendChild(span);
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <span className="text-muted">--</span>
                          )}
                        </td>
                        <td>{renderText(p.name)}</td>
                        <td>{renderText(p.company_name)}</td>
                        <td>{renderText(p.designation)}</td>
                        <td>{renderText(p.mobile)}</td>
                        <td>{renderText(p.whatsapp_no)}</td>
                        <td>{renderText(p.address)}</td>
                        <td>{renderText(p.state)}</td>
                        <td>{renderText(p.city)}</td>
                        <td>{renderText(p.latitude)}</td>
                        <td>{renderText(p.longitude)}</td>
                        <td>{formatDateDDMMYYYY(p.created_at)}</td>
                        <td>{formatDateDDMMYYYY(p.updated_at)}</td>
                        <td>
                          <div className="cp-table-actions">
                            <button
                              type="button"
                              className="cp-icon-btn"
                              aria-label="Edit"
                              title="Edit"
                              onClick={() => onEditPartner(p)}
                            >
                              <PencilIcon className="cp-icon" />
                            </button>
                            <button
                              type="button"
                              className="cp-icon-btn cp-icon-btn-danger"
                              aria-label="Delete"
                              title="Delete"
                              onClick={() => onDeletePartner(p)}
                              disabled={deletingId === p.id}
                            >
                              <TrashIcon className="cp-icon" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.lastPage > 1 ? (
                <div className="cp-pagination">
                  <button
                    type="button"
                    className="cp-page-btn"
                    onClick={() => fetchPartners(Math.max(1, page - 1))}
                    disabled={page <= 1 || listLoading}
                  >
                    Prev
                  </button>
                  <div className="cp-page-info">
                    Page {pagination.currentPage} of {pagination.lastPage}
                  </div>
                  <button
                    type="button"
                    className="cp-page-btn"
                    onClick={() => fetchPartners(Math.min(pagination.lastPage, page + 1))}
                    disabled={page >= pagination.lastPage || listLoading}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {isAddOpen ? (
        <div className="cp-modal-overlay" role="dialog" aria-modal="true">
          <div className="cp-modal">
            <div className="cp-modal-header">
              <h5>{isEditMode ? 'Edit Authorized Service Partner' : 'Add Authorized Service Partner'}</h5>
              <button type="button" className="cp-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <form className="cp-modal-body" onSubmit={submit}>
              {error ? <div className="cp-modal-error">{error}</div> : null}
              {photoError ? <div className="cp-modal-error">{photoError}</div> : null}

              {editLoading ? <div className="text-muted">Loading...</div> : null}

              <div className="cp-form-grid">
                <div className="cp-form-field cp-file-row">
                  <div className="cp-form-field">
                    <label>Photo {isEditMode ? '' : '*'}</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPhotoSelected(e.target.files?.[0] || null)}
                    />
                  </div>
                  {previewUrl ? (
                    <div className="cp-photo-preview-box">
                      <img src={previewUrl} alt="Preview" className="cp-photo-preview" />
                    </div>
                  ) : editPhotoUrl ? (
                    <div className="cp-photo-preview-box">
                      <img src={editPhotoUrl} alt="Current" className="cp-photo-preview" />
                    </div>
                  ) : (
                    <div className="cp-photo-preview-box" />
                  )}
                </div>

                <div className="cp-form-field">
                  <label>Name {isEditMode ? '' : '*'}</label>
                  <input value={form.name} onChange={(e) => onChange('name', e.target.value)} />
                  {fieldErrors?.name ? <div className="cp-field-hint">{String(fieldErrors.name?.[0] || fieldErrors.name)}</div> : null}
                </div>

                <div className="cp-form-field">
                  <label>Company Name {isEditMode ? '' : '*'}</label>
                  <input value={form.companyName} onChange={(e) => onChange('companyName', e.target.value)} />
                  {fieldErrors?.company_name ? (
                    <div className="cp-field-hint">{String(fieldErrors.company_name?.[0] || fieldErrors.company_name)}</div>
                  ) : null}
                </div>

                <div className="cp-form-field cp-span-full">
                  <label>Address {isEditMode ? '' : '*'}</label>
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => onChange('address', e.target.value)}
                  />
                  {fieldErrors?.address ? <div className="cp-field-hint">{String(fieldErrors.address?.[0] || fieldErrors.address)}</div> : null}
                </div>

                <div className="cp-form-field">
                  <label>Latitude {isEditMode ? '' : '*'}</label>
                  <input value={form.latitude} onChange={(e) => onChange('latitude', e.target.value)} />
                {fieldErrors?.latitude ? <div className="cp-field-hint">{String(fieldErrors.latitude?.[0] || fieldErrors.latitude)}</div> : null}
              </div>

              <div className="cp-form-field">
                <label>Longitude {isEditMode ? '' : '*'}</label>
                <div className="cp-input-with-action">

                  <input value={form.longitude} onChange={(e) => onChange('longitude', e.target.value)} />
                  <button type="button" className="cp-map-btn" onClick={openMapPicker}>
                    Select on Map
                  </button>
                                  </div>

                  {fieldErrors?.longitude ? <div className="cp-field-hint">{String(fieldErrors.longitude?.[0] || fieldErrors.longitude)}</div> : null}
                </div>

                <div className="cp-form-field">
                  <label>State {isEditMode ? '' : '*'}</label>
                  <select
                    value={form.stateId}
                    onChange={(e) => {
                      const next = e.target.value;
                      onChange('stateId', next);
                      onChange('city', '');
                      setCities([]);
                      setCitiesError('');
                      if (next) loadCitiesByStateId(next);
                    }}
                  >
                    <option value="">Select State</option>
                    {Array.isArray(states) && states.map((s) => {
                      const id = s && typeof s === 'object' ? (s.id ?? s.value ?? '') : '';
                      const label = s && typeof s === 'object' ? (s.name ?? s.label ?? s.title ?? id) : String(s);
                      return (
                        <option key={String(id || label)} value={String(id)}>
                          {String(label)}
                        </option>
                      );
                    })}
                  </select>
                  {statesLoading ? <div className="cp-field-hint">Loading states...</div> : null}
                  {statesError ? <div className="cp-field-hint">{statesError}</div> : null}
                  {fieldErrors?.state ? <div className="cp-field-hint">{String(fieldErrors.state?.[0] || fieldErrors.state)}</div> : null}
                </div>

                <div className="cp-form-field">
                  <label>City {isEditMode ? '' : '*'}</label>
                  <select
                    value={form.city}
                    onChange={(e) => onChange('city', e.target.value)}
                    disabled={!form.stateId || citiesLoading}
                  >
                    <option value="">{form.stateId ? 'Select City' : 'Select State first'}</option>
                    {Array.isArray(cities) && cities.map((c) => {
                      const id = c && typeof c === 'object' ? (c.id ?? c.value ?? c.city_id ?? '') : '';
                      const label = c && typeof c === 'object' ? (c.name ?? c.label ?? c.title ?? id) : String(c);
                      return (
                        <option key={String(id || label)} value={String(id || label)}>
                          {String(label)}
                        </option>
                      );
                    })}
                  </select>
                  {citiesLoading ? <div className="cp-field-hint">Loading cities...</div> : null}
                  {citiesError ? <div className="cp-field-hint">{citiesError}</div> : null}
                  {fieldErrors?.city ? <div className="cp-field-hint">{String(fieldErrors.city?.[0] || fieldErrors.city)}</div> : null}
                </div>

                <div className="cp-form-field">
                  <label>Designation {isEditMode ? '' : '*'}</label>
                  <input value={form.designation} onChange={(e) => onChange('designation', e.target.value)} />
                  {fieldErrors?.designation ? <div className="cp-field-hint">{String(fieldErrors.designation?.[0] || fieldErrors.designation)}</div> : null}
                </div>

                <div className="cp-form-field">
                  <label>Mobile {isEditMode ? '' : '*'}</label>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.mobile}
                    onChange={(e) => onDigitsChange('mobile', e.target.value)}
                  />
                  {fieldErrors?.mobile ? <div className="cp-field-hint">{String(fieldErrors.mobile?.[0] || fieldErrors.mobile)}</div> : null}
                </div>

                <div className="cp-form-field">
                  <label>Whatsapp No. {isEditMode ? '' : '*'}</label>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.whatsapp}
                    onChange={(e) => onDigitsChange('whatsapp', e.target.value)}
                  />
                  {fieldErrors?.whatsapp_no ? (
                    <div className="cp-field-hint">{String(fieldErrors.whatsapp_no?.[0] || fieldErrors.whatsapp_no)}</div>
                  ) : null}
                </div>
              </div>

              <div className="cp-modal-actions">
                <button type="button" className="cp-btn-secondary" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="cp-btn-primary" disabled={submitting || editLoading}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isCropOpen ? (
        <div className="cp-modal-overlay" role="dialog" aria-modal="true">
          <div className="cp-crop-modal">
            <div className="cp-modal-header">
              <h5>Crop Photo</h5>
              <button type="button" className="cp-modal-close" onClick={cancelCrop}>
                ×
              </button>
            </div>
            <div className="cp-crop-body">
              <div className="cp-crop-area">
                {cropImageSrc ? (
                  <Cropper
                    image={cropImageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    cropShape="rect"
                    showGrid={false}
                  />
                ) : null}
              </div>

              <div className="cp-crop-controls">
                <label className="cp-crop-label">Zoom</label>
                <input
                  className="cp-crop-zoom"
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </div>

              <div className="cp-modal-actions">
                <button type="button" className="cp-btn-secondary" onClick={cancelCrop}>
                  Cancel
                </button>
                <button type="button" className="cp-btn-primary" onClick={confirmCrop}>
                  Use Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isMapOpen ? (
        <div className="cp-modal-overlay" role="dialog" aria-modal="true">
          <div className="cp-map-modal">
            <div className="cp-modal-header">
              <h5>Select Location</h5>
              <button type="button" className="cp-modal-close" onClick={closeMapPicker}>
                ×
              </button>
            </div>

            <div className="cp-map-body">
              <div className="cp-map-area">
                {!leafletReady || !leafletComponents ? (
                  <div className="text-muted" style={{ padding: 12 }}>
                    Loading map...
                  </div>
                ) : (
                  (() => {
                    const { MapContainer, Marker, TileLayer } = leafletComponents;
                    return (
                      <MapContainer
                        key={mapOpenNonce}
                        center={mapDefaultCenter}
                        zoom={mapDefaultZoom}
                        style={{ width: '100%', height: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onPick={setMapPicked} />
                        {mapPicked && leafletMarkerIcon ? (
                          <Marker position={mapPicked} icon={leafletMarkerIcon} />
                        ) : mapPicked ? (
                          <Marker position={mapPicked} />
                        ) : null}
                      </MapContainer>
                    );
                  })()
                )}
              </div>

              <div className="cp-map-info">
                <div className="cp-map-coords">
                  <div>Latitude: {mapPicked ? String(mapPicked.lat) : '--'}</div>
                  <div>Longitude: {mapPicked ? String(mapPicked.lng) : '--'}</div>
                </div>
                <div className="cp-modal-actions">
                  <button type="button" className="cp-btn-secondary" onClick={closeMapPicker}>
                    Cancel
                  </button>
                  <button type="button" className="cp-btn-primary" onClick={usePickedLocation}>
                    Use Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
