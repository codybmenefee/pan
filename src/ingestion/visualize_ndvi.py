"""
Visualize NDVI output for validation.
"""
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors

def visualize_ndvi(ndvi_data, output_path="ndvi_output.png"):
    """
    Create NDVI visualization with color scale.

    NDVI Color Scale:
    - < 0.0: Blue (water)
    - 0.0-0.2: Brown (bare soil)
    - 0.2-0.4: Light green (sparse vegetation)
    - 0.4-0.6: Green (healthy pasture)
    - > 0.6: Dark green (dense biomass)
    """
    fig, ax = plt.subplots(figsize=(10, 10))

    colors = [
        (0.0, "#0000FF"),
        (0.2, "#8B4513"),
        (0.4, "#90EE90"),
        (0.6, "#228B22"),
        (1.0, "#006400"),
    ]
    cmap = mcolors.LinearSegmentedColormap.from_list("ndvi", colors)

    im = ax.imshow(ndvi_data[0], cmap=cmap, vmin=-0.2, vmax=1.0)
    ax.set_title("NDVI - Hillcrest Station")
    ax.axis("off")
    plt.colorbar(im, ax=ax, label="NDVI")

    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    print(f"NDVI visualization saved to {output_path}")
