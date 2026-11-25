import { FormEvent, useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Edit2, Eye, EyeOff, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import ResilientImage from '../../components/ResilientImage';
import FleetVehicleModal, {
  createDefaultVehicleDraft,
} from '../../components/admin/FleetVehicleModal';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteData } from '../../contexts/SiteDataContext';
import { db } from '../../lib/firebase';
import {
  DestinationDoc,
  JournalPostDoc,
  TestimonialDoc,
  VehicleDoc,
} from '../../lib/adminTypes';
import { formatKes } from '../../data/fleet';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';
import { seedDefaultFleetVehicles } from '../../lib/seedPortal';

type ContentTab = 'fleet' | 'journal' | 'destinations' | 'testimonials';

function toSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AdminContentPage() {
  const { isAdmin } = useAuth();
  const { settings } = useSiteData();
  const [activeTab, setActiveTab] = useState<ContentTab>('fleet');
  const [journal, setJournal] = useState<JournalPostDoc[]>([]);
  const [destinations, setDestinations] = useState<DestinationDoc[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialDoc[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [loadingFleet, setLoadingFleet] = useState(true);
  const [seedingFleet, setSeedingFleet] = useState(false);

  // Public Fleet Modal & Confirm Delete
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Partial<VehicleDoc> | null>(null);
  const [confirmDeleteVehicleId, setConfirmDeleteVehicleId] = useState<string | null>(null);

  // Journal Modal
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [editingPost, setEditingPost] = useState<JournalPostDoc | null>(null);
  const [jTitle, setJTitle] = useState('');
  const [jCategory, setJCategory] = useState('Road Advisories');
  const [jPublishedAt, setJPublishedAt] = useState('November 2026');
  const [jReadTime, setJReadTime] = useState('4 min read');
  const [jImage, setJImage] = useState('/src/assets/images/hero_prado_western_kenya_1795598677955.jpg');
  const [jExcerpt, setJExcerpt] = useState('');
  const [jBody, setJBody] = useState('');
  const [jRouteSlug, setJRouteSlug] = useState('lake-victoria-circuit');

  // Destination Modal
  const [showDestModal, setShowDestModal] = useState(false);
  const [editingDest, setEditingDest] = useState<DestinationDoc | null>(null);
  const [dName, setDName] = useState('');
  const [dCounty, setDCounty] = useState('Kisumu County');
  const [dDistance, setDDistance] = useState('45 km from Kisumu');
  const [dDriveTime, setDDriveTime] = useState('1 hr 15 min');
  const [dVehicleId, setDVehicleId] = useState('toyota-land-cruiser-prado');
  const [dImage, setDImage] = useState('/src/assets/images/dest_lake_victoria_1795598707039.jpg');
  const [dSummary, setDSummary] = useState('');
  const [dRoadConditions, setDRoadConditions] = useState('');
  const [dTips, setDTips] = useState('');
  const [dFeatured, setDFeatured] = useState(false);

  // Testimonial Modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState<TestimonialDoc | null>(null);
  const [tQuote, setTQuote] = useState('');
  const [tName, setTName] = useState('');
  const [tRole, setTRole] = useState('');
  const [tContext, setTContext] = useState('');
  const [tRoute, setTRoute] = useState('');

  useEffect(() => {
    const unsubJ = onSnapshot(
      collection(db, 'journal'),
      (snap) => setJournal(snap.docs.map((d) => ({ ...(d.data() as JournalPostDoc), id: d.id }))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'journal')
    );
    const unsubD = onSnapshot(
      collection(db, 'destinations'),
      (snap) => setDestinations(snap.docs.map((d) => ({ ...(d.data() as DestinationDoc), id: d.id }))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'destinations')
    );
    const unsubT = onSnapshot(
      collection(db, 'testimonials'),
      (snap) => setTestimonials(snap.docs.map((d) => ({ ...(d.data() as TestimonialDoc), id: d.id }))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'testimonials')
    );
    const unsubV = onSnapshot(
      collection(db, 'vehicles'),
      (snap) => {
        setVehicles(snap.docs.map((d) => ({ ...(d.data() as VehicleDoc), id: d.id })));
        setLoadingFleet(false);
      },
      (err) => {
        setLoadingFleet(false);
        handleFirestoreError(err, OperationType.LIST, 'vehicles');
      }
    );

    return () => {
      unsubJ();
      unsubD();
      unsubT();
      unsubV();
    };
  }, []);

  // Fleet handlers
  function openAddVehicle() {
    setIsNewVehicle(true);
    setEditingVehicle(createDefaultVehicleDraft(settings));
    setVehicleModalOpen(true);
  }

  function openEditVehicle(v: VehicleDoc) {
    setIsNewVehicle(false);
    setEditingVehicle(v);
    setVehicleModalOpen(true);
  }

  async function handleToggleVehicleVisibility(v: VehicleDoc) {
    try {
      await updateDoc(doc(db, 'vehicles', v.id), {
        status: v.status === 'Inactive' ? 'Available' : 'Inactive',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vehicles/${v.id}`);
    }
  }

  async function handleDeleteVehicle(id: string) {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'vehicles', id));
      setConfirmDeleteVehicleId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `vehicles/${id}`);
    }
  }

  async function handleLoadDefaultFleet() {
    setSeedingFleet(true);
    try {
      await seedDefaultFleetVehicles();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'vehicles');
    } finally {
      setSeedingFleet(false);
    }
  }

  async function handleDeleteContent(col: 'journal' | 'destinations' | 'testimonials', id: string) {
    try {
      await deleteDoc(doc(db, col, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${col}/${id}`);
    }
  }

  // Journal handlers
  function openJournalModal(post?: JournalPostDoc) {
    if (post) {
      setEditingPost(post);
      setJTitle(post.title);
      setJCategory(post.category);
      setJPublishedAt(post.publishedAt);
      setJReadTime(post.readTime);
      setJImage(post.image);
      setJExcerpt(post.excerpt);
      setJBody(post.body);
      setJRouteSlug(post.recommendedRouteSlug || 'lake-victoria-circuit');
    } else {
      setEditingPost(null);
      setJTitle('');
      setJCategory('Road Advisories');
      setJPublishedAt('November 2026');
      setJReadTime('4 min read');
      setJImage('/src/assets/images/hero_prado_western_kenya_1795598677955.jpg');
      setJExcerpt('');
      setJBody('');
      setJRouteSlug('lake-victoria-circuit');
    }
    setShowJournalModal(true);
  }

  async function saveJournalPost(e: FormEvent) {
    e.preventDefault();
    const id = editingPost ? editingPost.id : `${toSlug(jTitle)}-${Date.now().toString().slice(-4)}`;
    const slug = editingPost ? editingPost.slug : toSlug(jTitle);
    const payload = {
      slug,
      title: jTitle.trim(),
      category: jCategory.trim(),
      publishedAt: jPublishedAt.trim(),
      readTime: jReadTime.trim(),
      image: jImage.trim(),
      excerpt: jExcerpt.trim(),
      body: jBody.trim(),
      recommendedRouteSlug: jRouteSlug.trim(),
      updatedAt: serverTimestamp(),
    };
    try {
      if (editingPost) {
        await updateDoc(doc(db, 'journal', id), payload);
      } else {
        await setDoc(doc(db, 'journal', id), payload);
      }
      setShowJournalModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `journal/${id}`);
    }
  }

  // Destination handlers
  function openDestModal(dest?: DestinationDoc) {
    if (dest) {
      setEditingDest(dest);
      setDName(dest.name);
      setDCounty(dest.county);
      setDDistance(dest.distanceFromKisumu);
      setDDriveTime(dest.driveTime);
      setDVehicleId(dest.recommendedVehicleId);
      setDImage(dest.image);
      setDSummary(dest.summary);
      setDRoadConditions(dest.roadConditions);
      setDTips(dest.localTipsText || '');
      setDFeatured(dest.featuredOnHome);
    } else {
      setEditingDest(null);
      setDName('');
      setDCounty('Kisumu County');
      setDDistance('45 km from Kisumu');
      setDDriveTime('1 hr 15 min');
      setDVehicleId(vehicles[0]?.id || 'toyota-land-cruiser-prado');
      setDImage('/src/assets/images/dest_lake_victoria_1795598707039.jpg');
      setDSummary('');
      setDRoadConditions('');
      setDTips('');
      setDFeatured(false);
    }
    setShowDestModal(true);
  }

  async function saveDestination(e: FormEvent) {
    e.preventDefault();
    const id = editingDest ? editingDest.id : toSlug(dName);
    const matchedV = vehicles.find((v) => v.id === dVehicleId);
    const payload = {
      slug: editingDest ? editingDest.slug : id,
      name: dName.trim(),
      county: dCounty.trim(),
      distanceFromKisumu: dDistance.trim(),
      driveTime: dDriveTime.trim(),
      recommendedVehicle: matchedV ? matchedV.name : 'Toyota Land Cruiser Prado',
      recommendedVehicleId: dVehicleId,
      image: dImage.trim(),
      summary: dSummary.trim(),
      roadConditions: dRoadConditions.trim(),
      localTipsText: dTips.trim(),
      featuredOnHome: dFeatured,
      updatedAt: serverTimestamp(),
    };
    try {
      if (editingDest) {
        await updateDoc(doc(db, 'destinations', id), payload);
      } else {
        await setDoc(doc(db, 'destinations', id), payload);
      }
      setShowDestModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `destinations/${id}`);
    }
  }

  // Testimonial handlers
  function openTestModal(t?: TestimonialDoc) {
    if (t) {
      setEditingTest(t);
      setTQuote(t.quote);
      setTName(t.clientName);
      setTRole(t.role);
      setTContext(t.context);
      setTRoute(t.route);
    } else {
      setEditingTest(null);
      setTQuote('');
      setTName('');
      setTRole('');
      setTContext('');
      setTRoute('');
    }
    setShowTestModal(true);
  }

  async function saveTestimonial(e: FormEvent) {
    e.preventDefault();
    const id = editingTest ? editingTest.id : `test_${Date.now()}`;
    const payload = {
      quote: tQuote.trim(),
      clientName: tName.trim(),
      role: tRole.trim(),
      context: tContext.trim(),
      route: tRoute.trim(),
      updatedAt: serverTimestamp(),
    };
    try {
      if (editingTest) {
        await updateDoc(doc(db, 'testimonials', id), payload);
      } else {
        await setDoc(doc(db, 'testimonials', id), payload);
      }
      setShowTestModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `testimonials/${id}`);
    }
  }

  const visibleFleetCount = vehicles.filter((v) => v.status !== 'Inactive').length;
  const hiddenFleetCount = vehicles.length - visibleFleetCount;

  return (
    <AdminLayout title="Website Content Manager (CMS)" breadcrumb="Content">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EFF3F9] rounded-lg border border-[#111827]/10">
            {(
              [
                { id: 'fleet', label: `Public Fleet (${vehicles.length})` },
                { id: 'journal', label: `Journal Articles (${journal.length})` },
                { id: 'destinations', label: `Destinations (${destinations.length})` },
                { id: 'testimonials', label: `Testimonials (${testimonials.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#194793] text-white'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeTab === 'fleet') openAddVehicle();
              if (activeTab === 'journal') openJournalModal();
              if (activeTab === 'destinations') openDestModal();
              if (activeTab === 'testimonials') openTestModal();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#194793] text-white text-xs sm:text-sm font-semibold hover:bg-[#133672]"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === 'fleet'
                ? 'Add Fleet Vehicle'
                : activeTab === 'journal'
                  ? 'New Journal Post'
                  : activeTab === 'destinations'
                    ? 'Add Destination'
                    : 'Add Testimonial'}
            </span>
          </button>
        </div>

        {/* Public Fleet Storefront Manager */}
        {activeTab === 'fleet' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#111827]/10 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <p className="text-[#4B5563]">
                Control which vehicles customers see on the public <span className="font-semibold text-[#111827]">Fleet</span>,{' '}
                <span className="font-semibold text-[#111827]">Home</span>, and{' '}
                <span className="font-semibold text-[#111827]">Booking</span> pages.
              </p>
              <p className="font-mono tabular-nums text-[#111827]">
                <span className="font-semibold text-[#16A34A]">{visibleFleetCount} visible</span>
                {' · '}
                <span className="text-[#4B5563]">{hiddenFleetCount} hidden</span>
              </p>
            </div>

            {loadingFleet ? (
              <div className="rounded-lg border border-[#111827]/10 bg-white p-10 text-center text-sm text-[#4B5563]">
                Loading public fleet vehicles...
              </div>
            ) : vehicles.length === 0 ? (
              <div className="rounded-lg border border-[#111827]/10 bg-white p-10 text-center space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#111827]">
                    No fleet vehicles are currently published.
                  </p>
                  <p className="text-xs text-[#4B5563]">
                    Load the standard 8-vehicle Kechas Agencies fleet or add a new vehicle to display on the website.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={seedingFleet}
                    onClick={handleLoadDefaultFleet}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-[#194793]/25 bg-[#EFF3F9] text-xs sm:text-sm font-semibold text-[#194793] hover:bg-[#DCE5F2] disabled:opacity-60"
                  >
                    <RefreshCw className={`w-4 h-4 ${seedingFleet ? 'animate-spin' : ''}`} />
                    <span>{seedingFleet ? 'Loading Fleet...' : 'Load Standard 8-Vehicle Fleet'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={openAddVehicle}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#194793] text-white text-xs sm:text-sm font-semibold hover:bg-[#133672]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Fleet Vehicle</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {vehicles.map((v) => {
                  const isVisible = v.status !== 'Inactive';
                  return (
                    <article
                      key={v.id}
                      className={`rounded-lg border bg-white overflow-hidden flex flex-col justify-between transition-opacity ${
                        isVisible ? 'border-[#111827]/12' : 'border-[#111827]/15 opacity-80'
                      }`}
                    >
                      <div>
                        <div className="aspect-[4/3] bg-[#E5EBF4] overflow-hidden">
                          <ResilientImage
                            src={v.image}
                            alt={v.name}
                            className="w-full h-full object-cover"
                            fallbackLabel={v.name}
                          />
                        </div>
                        <div className="p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold text-[#C8231D] truncate">
                                {v.categoryLabel} · {v.transmission} · {v.fuelType}
                              </p>
                              <h3 className="font-serif text-lg text-[#111827] leading-snug truncate">
                                {v.name}
                              </h3>
                              <p className="text-[11px] font-mono text-[#4B5563]">
                                {v.registrationPlate} · {v.passengers} Pax · {v.luggage} Bags
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-mono text-sm font-semibold text-[#194793] tabular-nums">
                                {formatKes(v.dailyRateKes)}/d
                              </div>
                              <div className="text-[11px] font-mono text-[#4B5563] tabular-nums">
                                {v.selfDriveAvailable && v.selfDriveRateKes > 0
                                  ? `SD: ${formatKes(v.selfDriveRateKes)}`
                                  : 'Chauffeur only'}
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
                            {v.highlight}
                          </p>

                          <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
                            <span
                              className={`inline-flex items-center gap-1 font-sans font-semibold ${
                                isVisible
                                  ? v.status === 'In Maintenance'
                                    ? 'text-[#C8231D]'
                                    : 'text-[#16A34A]'
                                  : 'text-[#6B7280]'
                              }`}
                            >
                              {isVisible ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Visible on Website ({v.status})</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Hidden from Website</span>
                                </>
                              )}
                            </span>
                            <span className="text-[#4B5563] tabular-nums">
                              {v.passengers} Pax · {v.luggage} Bags
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#111827]/10 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleVehicleVisibility(v)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#111827]/20 bg-white text-xs font-medium text-[#111827] hover:bg-[#EFF3F9]"
                        >
                          {isVisible ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-[#4B5563]" />
                              <span>Hide</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-[#194793]" />
                              <span>Show on Site</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditVehicle(v)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#194793]/25 bg-white text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {isAdmin &&
                            (confirmDeleteVehicleId === v.id ? (
                              <span className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVehicle(v.id)}
                                  className="px-2.5 py-1.5 rounded bg-[#C8231D] text-white text-xs font-semibold hover:bg-[#A61B16]"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteVehicleId(null)}
                                  className="px-2 py-1.5 rounded border border-[#111827]/20 bg-white text-xs text-[#4B5563]"
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteVehicleId(v.id)}
                                className="p-1.5 rounded border border-[#C8231D]/25 bg-white text-[#C8231D] hover:bg-[#FEF2F2]"
                                aria-label={`Delete ${v.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Journal List */}
        {activeTab === 'journal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {journal.map((post) => (
              <article
                key={post.id}
                className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <img src={post.image} alt={post.title} className="w-full h-40 object-cover bg-[#E5EBF4]" />
                  <div className="p-4 space-y-2">
                    <p className="text-[11px] font-semibold text-[#C8231D]">
                      {post.category} · {post.publishedAt}
                    </p>
                    <h3 className="font-serif text-lg text-[#111827] leading-snug">{post.title}</h3>
                    <p className="text-xs text-[#4B5563] line-clamp-3">{post.excerpt}</p>
                  </div>
                </div>
                <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#111827]/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openJournalModal(post)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#194793]/25 text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteContent('journal', post.id)}
                    className="p-1.5 rounded border border-[#C8231D]/25 text-[#C8231D] hover:bg-[#FEF2F2]"
                    aria-label="Delete article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Destinations List */}
        {activeTab === 'destinations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {destinations.map((dest) => (
              <article
                key={dest.id}
                className="rounded-lg border border-[#111827]/10 bg-white overflow-hidden flex flex-col justify-between"
              >
                <div className="flex flex-col sm:flex-row">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full sm:w-44 h-40 sm:h-auto object-cover bg-[#E5EBF4] shrink-0"
                  />
                  <div className="p-4 space-y-1.5">
                    <p className="text-[11px] font-semibold text-[#C8231D]">
                      {dest.county} {dest.featuredOnHome ? '· Featured on Home' : ''}
                    </p>
                    <h3 className="font-serif text-lg text-[#111827]">{dest.name}</h3>
                    <p className="text-xs text-[#4B5563]">
                      {dest.distanceFromKisumu} · {dest.driveTime}
                    </p>
                    <p className="text-xs text-[#4B5563] line-clamp-2">{dest.summary}</p>
                    <p className="text-[11px] font-medium text-[#194793]">
                      Recommended: {dest.recommendedVehicle}
                    </p>
                  </div>
                </div>
                <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#111827]/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openDestModal(dest)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#194793]/25 text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteContent('destinations', dest.id)}
                    className="p-1.5 rounded border border-[#C8231D]/25 text-[#C8231D] hover:bg-[#FEF2F2]"
                    aria-label="Delete destination"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Testimonials List */}
        {activeTab === 'testimonials' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <article
                key={t.id}
                className="rounded-lg border border-[#111827]/10 bg-white p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-[#111827]">“{t.quote}”</p>
                  <div className="text-xs">
                    <p className="font-semibold text-[#111827]">{t.clientName}</p>
                    <p className="text-[#4B5563]">
                      {t.role} · {t.context}
                    </p>
                    <p className="text-[#194793] font-semibold mt-1">{t.route}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[#111827]/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openTestModal(t)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#194793]/25 text-xs font-semibold text-[#194793] hover:bg-[#EFF3F9]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteContent('testimonials', t.id)}
                    className="p-1.5 rounded border border-[#C8231D]/25 text-[#C8231D] hover:bg-[#FEF2F2]"
                    aria-label="Delete testimonial"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Journal Modal */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 p-4">
          <form
            onSubmit={saveJournalPost}
            className="w-full max-w-xl rounded-lg bg-white border border-[#111827]/15 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#111827]">
                {editingPost ? 'Edit Journal Article' : 'Publish Journal Article'}
              </h2>
              <button type="button" onClick={() => setShowJournalModal(false)} className="p-1.5 rounded border border-[#111827]/15">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Title *</label>
              <input type="text" required value={jTitle} onChange={(e) => setJTitle(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Category</label>
                <input type="text" required value={jCategory} onChange={(e) => setJCategory(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Published Date</label>
                <input type="text" required value={jPublishedAt} onChange={(e) => setJPublishedAt(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Read Time</label>
                <input type="text" required value={jReadTime} onChange={(e) => setJReadTime(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Cover Image URL</label>
              <input type="text" required value={jImage} onChange={(e) => setJImage(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
            </div>
            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Excerpt *</label>
              <textarea rows={2} required value={jExcerpt} onChange={(e) => setJExcerpt(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
            </div>
            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Article Body (separate sections with blank lines) *</label>
              <textarea rows={6} required value={jBody} onChange={(e) => setJBody(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowJournalModal(false)} className="px-4 py-2 rounded-md border border-[#111827]/20 text-xs">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672]">Save Article</button>
            </div>
          </form>
        </div>
      )}

      {/* Destination Modal */}
      {showDestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 p-4">
          <form
            onSubmit={saveDestination}
            className="w-full max-w-xl rounded-lg bg-white border border-[#111827]/15 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#111827]">
                {editingDest ? `Edit ${editingDest.name}` : 'Add Regional Destination'}
              </h2>
              <button type="button" onClick={() => setShowDestModal(false)} className="p-1.5 rounded border border-[#111827]/15">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Destination Name *</label>
                <input type="text" required value={dName} onChange={(e) => setDName(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">County *</label>
                <input type="text" required value={dCounty} onChange={(e) => setDCounty(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Distance</label>
                <input type="text" required value={dDistance} onChange={(e) => setDDistance(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Drive Time</label>
                <input type="text" required value={dDriveTime} onChange={(e) => setDDriveTime(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Recommended Vehicle</label>
                <select value={dVehicleId} onChange={(e) => setDVehicleId(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]">
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Image URL</label>
              <input type="text" required value={dImage} onChange={(e) => setDImage(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
            </div>
            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Summary *</label>
              <textarea rows={2} required value={dSummary} onChange={(e) => setDSummary(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
            </div>
            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Road Surface & Seasonality *</label>
              <textarea rows={2} required value={dRoadConditions} onChange={(e) => setDRoadConditions(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
            </div>
            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Dispatch Tips (one per line)</label>
              <textarea rows={3} value={dTips} onChange={(e) => setDTips(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={dFeatured} onChange={(e) => setDFeatured(e.target.checked)} />
              <span>Feature on Home Page</span>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowDestModal(false)} className="px-4 py-2 rounded-md border border-[#111827]/20 text-xs">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672]">Save Destination</button>
            </div>
          </form>
        </div>
      )}

      {/* Testimonial Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 p-4">
          <form
            onSubmit={saveTestimonial}
            className="w-full max-w-lg rounded-lg bg-white border border-[#111827]/15 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#111827]">
                {editingTest ? 'Edit Testimonial' : 'Add Client Testimonial'}
              </h2>
              <button type="button" onClick={() => setShowTestModal(false)} className="p-1.5 rounded border border-[#111827]/15">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <label className="text-[#4B5563]">Client Quote *</label>
              <textarea rows={3} required value={tQuote} onChange={(e) => setTQuote(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Client Name *</label>
                <input type="text" required value={tName} onChange={(e) => setTName(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Role / Organization *</label>
                <input type="text" required value={tRole} onChange={(e) => setTRole(e.target.value)} className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#4B5563]">Trip Context *</label>
                <input type="text" required value={tContext} onChange={(e) => setTContext(e.target.value)} placeholder="NGO Field Audit" className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
              </div>
              <div className="space-y-1">
                <label className="text-[#4B5563]">Route *</label>
                <input type="text" required value={tRoute} onChange={(e) => setTRoute(e.target.value)} placeholder="Kisumu – Ruma – Migori" className="w-full px-3 py-2 rounded border border-[#111827]/20 bg-[#F9FAFB]" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowTestModal(false)} className="px-4 py-2 rounded-md border border-[#111827]/20 text-xs">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-md bg-[#194793] text-white text-xs font-semibold hover:bg-[#133672]">Save Testimonial</button>
            </div>
          </form>
        </div>
      )}

      <FleetVehicleModal
        open={vehicleModalOpen}
        isNew={isNewVehicle}
        initialVehicle={editingVehicle}
        defaultShowCompliance={false}
        onClose={() => {
          setVehicleModalOpen(false);
          setEditingVehicle(null);
        }}
      />
    </AdminLayout>
  );
}
